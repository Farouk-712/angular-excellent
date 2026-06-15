import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, catchError, combineLatest, finalize, forkJoin, map, of, scan, shareReplay, switchMap, tap, withLatestFrom } from 'rxjs';

import {
  AuditDashboardVm,
  AuditFinding,
  AuditPage,
  AuditSearchQuery,
  AuditSession,
  AuditStatus,
  UpdateFindingRequest,
} from '../models/quality-audit.models';
import { buildAuditSummary, filterSessions, rebuildCriteriaWithFindings, sortFindingsByRisk } from '../utils/quality-audit-rules';
import { QualityAuditApiService } from './quality-audit-api.service';

const initialQuery: AuditSearchQuery = {
  status: AuditStatus.Completed,
  minScore: 0.7,
  text: '',
  pageIndex: 0,
  pageSize: 12,
};

interface AuditState {
  readonly page: AuditPage<AuditSession>;
  readonly selectedId: string | null;
  readonly loading: boolean;
  readonly errorMessage: string | null;
  readonly query: AuditSearchQuery;
}

const emptyPage: AuditPage<AuditSession> = {
  items: [],
  total: 0,
  pageIndex: 0,
  pageSize: 12,
};

@Injectable({ providedIn: 'root' })
export class QualityAuditStoreService {
  private readonly api = inject(QualityAuditApiService);
  private readonly refreshSubject = new BehaviorSubject<void>(undefined);
  private readonly querySubject = new BehaviorSubject<AuditSearchQuery>(initialQuery);
  private readonly selectedIdSubject = new BehaviorSubject<string | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly loading = this.loadingSignal.asReadonly();
  readonly errorMessage = this.errorSignal.asReadonly();
  readonly hasError = computed(() => this.errorSignal() !== null);

  readonly query$ = this.querySubject.asObservable();
  readonly selectedId$ = this.selectedIdSubject.asObservable();

  readonly page$: Observable<AuditPage<AuditSession>> = combineLatest([
    this.query$,
    this.refreshSubject.asObservable(),
  ]).pipe(
    tap(() => {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);
    }),
    switchMap(([query]) =>
      this.api.getAll(query).pipe(
        catchError((error: Error) => {
          this.errorSignal.set(error.message);
          return of(emptyPage);
        }),
        finalize(() => this.loadingSignal.set(false)),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly selectedSession$: Observable<AuditSession | null> = combineLatest([
    this.page$,
    this.selectedId$,
  ]).pipe(
    map(([page, selectedId]) => page.items.find((session) => session.id === selectedId) ?? page.items[0] ?? null),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly criticalFindings$: Observable<ReadonlyArray<AuditFinding>> = this.selectedSession$.pipe(
    map((session) => sortFindingsByRisk(session?.findings ?? []).filter((finding) => !finding.resolved).slice(0, 6)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly vm$: Observable<AuditDashboardVm> = combineLatest([
    this.page$,
    this.selectedSession$,
    this.criticalFindings$,
    this.query$,
  ]).pipe(
    map(([page, selectedSession, criticalFindings, query]) => {
      const summary = selectedSession?.summary ?? buildAuditSummary({ criteria: [], findings: [] });

      return {
        sessions: filterSessions(page.items, query.text ?? ''),
        selectedSession,
        summary,
        criteria: selectedSession?.criteria ?? [],
        criticalFindings,
        loading: this.loadingSignal(),
        errorMessage: this.errorSignal(),
        query,
      } satisfies AuditDashboardVm;
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor() {
    effect(() => {
      const hasError = this.hasError();
      if (hasError) {
        this.loadingSignal.set(false);
      }
    });
  }

  refresh(): void {
    this.refreshSubject.next();
  }

  selectSession(sessionId: string): void {
    this.selectedIdSubject.next(sessionId);
  }

  updateQuery(partial: Partial<AuditSearchQuery>): void {
    const currentQuery = this.querySubject.value;
    this.querySubject.next({
      ...currentQuery,
      ...partial,
      pageIndex: partial.pageIndex ?? 0,
    });
  }

  resolveFinding(sessionId: string, finding: AuditFinding): Observable<AuditSession> {
    const request: UpdateFindingRequest = {
      resolved: true,
      suggestion: finding.suggestion,
    };

    return this.api.patchFinding(sessionId, finding.id, request).pipe(
      withLatestFrom(this.page$),
      map(([updatedSession, page]) => this.mergeUpdatedSession(updatedSession, page)),
      tap((page) => this.applyPageSnapshot(page)),
      map((page) => page.items.find((session) => session.id === sessionId) as AuditSession),
      catchError((error: Error) => {
        this.errorSignal.set(error.message);
        return of(this.buildOptimisticSession(sessionId, finding));
      }),
    );
  }

  runFullAudit(repositoryIds: ReadonlyArray<string>): Observable<ReadonlyArray<AuditSession>> {
    const requests = repositoryIds.map((repositoryId) =>
      this.api.create({
        repositoryId,
        branchName: 'main',
        reviewers: ['tech-lead-001'],
        checklist: {
          items: [],
          completedCount: 0,
          requiredCompletionRate: 1,
        },
      }),
    );

    return forkJoin(requests).pipe(
      scan((accumulator, sessions) => [...accumulator, ...sessions], [] as ReadonlyArray<AuditSession>),
      tap(() => this.refresh()),
      catchError((error: Error) => {
        this.errorSignal.set(error.message);
        return of([]);
      }),
    );
  }

  private mergeUpdatedSession(updatedSession: AuditSession, page: AuditPage<AuditSession>): AuditPage<AuditSession> {
    const items = page.items.map((session) => (session.id === updatedSession.id ? updatedSession : session));

    return {
      ...page,
      items,
    };
  }

  private applyPageSnapshot(page: AuditPage<AuditSession>): void {
    const currentQuery = this.querySubject.value;
    this.querySubject.next({ ...currentQuery, pageIndex: page.pageIndex });
  }

  private buildOptimisticSession(sessionId: string, finding: AuditFinding): AuditSession {
    const snapshot = emptyPage.items.find((session) => session.id === sessionId);

    if (!snapshot) {
      throw new Error('Audit introuvable pour la mise à jour optimiste.');
    }

    const findings = snapshot.findings.map((item) =>
      item.id === finding.id ? { ...item, resolved: true } : item,
    );
    const criteria = rebuildCriteriaWithFindings(snapshot.criteria, findings);

    return {
      ...snapshot,
      findings,
      criteria,
      summary: buildAuditSummary({ criteria, findings }),
    };
  }
}
