import { Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  Subject,
  catchError,
  combineLatest,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  exhaustMap,
  finalize,
  map,
  mergeMap,
  of,
  scan,
  shareReplay,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';

import {
  EnterpriseWorkflow,
  WorkflowFilters,
  WorkflowPriority,
  WorkflowRiskLevel,
  WorkflowStatus,
  WorkflowUpdatePayload,
  WorkflowViewModel,
} from '../models/enterprise-workflow.models';
import {
  buildWorkflowDictionary,
  calculateDashboardMetrics,
  calculateWorkflowRisk,
  filterWorkflows,
} from '../utils/enterprise-workflow-scoring.engine';
import { EnterpriseWorkflowApiService } from './enterprise-workflow-api.service';

const DEFAULT_FILTERS: WorkflowFilters = {
  search: '',
  status: 'all',
  risk: 'all',
  priority: 'all',
  ownerId: null,
  onlyLate: false,
};

@Injectable({ providedIn: 'root' })
export class EnterpriseWorkflowStoreService {
  private readonly api = inject(EnterpriseWorkflowApiService);

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly savingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new ReplaySubject<string | null>(1);
  private readonly workflowsSubject = new BehaviorSubject<ReadonlyArray<EnterpriseWorkflow>>([]);
  private readonly selectedIdSubject = new BehaviorSubject<string | null>(null);
  private readonly filtersSubject = new BehaviorSubject<WorkflowFilters>(DEFAULT_FILTERS);
  private readonly refreshSubject = new Subject<void>();
  private readonly saveQueueSubject = new Subject<{ id: string; payload: WorkflowUpdatePayload }>();

  readonly workflows$ = this.workflowsSubject.asObservable();
  readonly filters$ = this.filtersSubject.asObservable();
  readonly selectedId$ = this.selectedIdSubject.asObservable();

  readonly workflows = signal<ReadonlyArray<EnterpriseWorkflow>>([]);
  readonly selectedId = signal<string | null>(null);
  readonly filters = signal<WorkflowFilters>(DEFAULT_FILTERS);

  readonly selectedWorkflow = computed(() => {
    const dictionary = buildWorkflowDictionary(this.workflows());
    const selectedId = this.selectedId();

    return selectedId ? dictionary[selectedId] ?? null : null;
  });

  readonly metrics = computed(() => calculateDashboardMetrics(this.workflows()));

  readonly filteredWorkflows$ = combineLatest([
    this.workflows$,
    this.filters$.pipe(debounceTime(120), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))),
  ]).pipe(
    map(([workflows, filters]) =>
      filterWorkflows(
        workflows,
        filters.search,
        filters.status,
        filters.risk,
        filters.priority,
        filters.ownerId,
        filters.onlyLate,
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly viewModel$: Observable<WorkflowViewModel> = combineLatest([
    this.loadingSubject.asObservable(),
    this.savingSubject.asObservable(),
    this.errorSubject.asObservable(),
    this.filteredWorkflows$,
    this.selectedId$,
    this.filters$,
  ]).pipe(
    map(([loading, saving, error, workflows, selectedId, filters]) => {
      const dictionary = buildWorkflowDictionary(workflows);
      const riskByWorkflow = workflows.reduce((accumulator, workflow) => {
        return {
          ...accumulator,
          [workflow.id]: calculateWorkflowRisk(workflow),
        };
      }, {} as Record<string, ReturnType<typeof calculateWorkflowRisk>>);

      return {
        loading,
        saving,
        error,
        filters,
        workflows,
        selectedWorkflow: selectedId ? dictionary[selectedId] ?? null : null,
        metrics: calculateDashboardMetrics(workflows),
        riskByWorkflow,
      };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor() {
    effect(() => {
      this.workflowsSubject.next(this.workflows());
      this.selectedIdSubject.next(this.selectedId());
      this.filtersSubject.next(this.filters());
    });

    this.refreshSubject.pipe(
      tap(() => this.loadingSubject.next(true)),
      switchMap(() => this.api.getAll().pipe(
        catchError((error: unknown) => {
          this.errorSubject.next(error instanceof Error ? error.message : 'Unable to load workflows');
          return of([] as ReadonlyArray<EnterpriseWorkflow>);
        }),
        finalize(() => this.loadingSubject.next(false)),
      )),
    ).subscribe((workflows) => {
      this.workflows.set(workflows);
      this.errorSubject.next(null);
    });

    this.saveQueueSubject.pipe(
      withLatestFrom(this.workflows$),
      concatMap(([command, workflows]) => {
        const previous = workflows.find((workflow) => workflow.id === command.id);
        this.savingSubject.next(true);

        return this.api.update(command.id, command.payload).pipe(
          tap((updated) => this.replaceWorkflow(updated)),
          catchError((error: unknown) => {
            if (previous) {
              this.replaceWorkflow(previous);
            }

            this.errorSubject.next(error instanceof Error ? error.message : 'Unable to save workflow');
            return of(null);
          }),
          finalize(() => this.savingSubject.next(false)),
        );
      }),
    ).subscribe();

    this.workflows$.pipe(
      scan((history, workflows) => [workflows, ...history].slice(0, 5), [] as ReadonlyArray<ReadonlyArray<EnterpriseWorkflow>>),
      mergeMap((history) => of(history.length)),
      exhaustMap((count) => of(count)),
    ).subscribe();
  }

  loadAll(): Observable<ReadonlyArray<EnterpriseWorkflow>> {
    this.refreshSubject.next();
    return this.workflows$;
  }

  refresh(): void {
    this.refreshSubject.next();
  }

  select(id: string | null): void {
    this.selectedId.set(id);
  }

  updateFilters(filters: Partial<WorkflowFilters>): void {
    this.filters.update((current) => ({ ...current, ...filters }));
  }

  updateStatus(id: string, status: WorkflowStatus): void {
    this.saveQueueSubject.next({ id, payload: { status } });
  }

  updatePriority(id: string, priority: WorkflowPriority): void {
    this.saveQueueSubject.next({ id, payload: { priority } });
  }

  filterByRisk(risk: WorkflowRiskLevel | 'all'): void {
    this.updateFilters({ risk });
  }

  delete(id: string): Observable<void> {
    this.savingSubject.next(true);

    return this.api.delete(id).pipe(
      tap(() => {
        this.workflows.update((workflows) => workflows.filter((workflow) => workflow.id !== id));
      }),
      finalize(() => this.savingSubject.next(false)),
    );
  }

  private replaceWorkflow(updated: EnterpriseWorkflow): void {
    this.workflows.update((workflows) => {
      const exists = workflows.some((workflow) => workflow.id === updated.id);

      if (!exists) {
        return [updated, ...workflows];
      }

      return workflows.map((workflow) => (workflow.id === updated.id ? updated : workflow));
    });
  }
}
