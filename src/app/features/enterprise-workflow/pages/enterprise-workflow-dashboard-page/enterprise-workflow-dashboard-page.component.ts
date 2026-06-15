import { AsyncPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, tap } from 'rxjs';

import { EnterpriseFeatureFlagDirective } from '../../directives/enterprise-feature-flag.directive';
import { EnterpriseWorkflowFacade } from '../../facades/enterprise-workflow.facade';
import { WorkflowPriority, WorkflowRiskLevel, WorkflowStatus } from '../../models/enterprise-workflow.models';
import { WorkflowKanbanComponent } from '../../components/workflow-kanban/workflow-kanban.component';
import { WorkflowMetricCardComponent } from '../../components/workflow-metric-card/workflow-metric-card.component';
import { WorkflowRiskMatrixComponent } from '../../components/workflow-risk-matrix/workflow-risk-matrix.component';

@Component({
  selector: 'app-enterprise-workflow-dashboard-page',
  standalone: true,
  imports: [
    AsyncPipe,
    DecimalPipe,
    RouterLink,
    RouterLinkActive,
    EnterpriseFeatureFlagDirective,
    WorkflowKanbanComponent,
    WorkflowMetricCardComponent,
    WorkflowRiskMatrixComponent,
  ],
  templateUrl: './enterprise-workflow-dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterpriseWorkflowDashboardPageComponent implements OnInit {
  private readonly facade = inject(EnterpriseWorkflowFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly viewModel$ = this.facade.viewModel$;
  readonly selectedWorkflow = this.facade.selectedWorkflow;
  readonly metrics = this.facade.metrics;
  readonly riskLevels = Object.values(WorkflowRiskLevel);
  readonly statuses = Object.values(WorkflowStatus);
  readonly priorities = Object.values(WorkflowPriority);

  readonly querySearch = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => params.get('search') ?? ''),
      debounceTime(100),
      distinctUntilChanged(),
      tap((search) => this.facade.updateFilters({ search })),
    ),
    { initialValue: '' },
  );

  readonly pageTitle = computed(() => {
    const total = this.metrics().totalWorkflows;
    return total > 1 ? `${total} enterprise workflows` : `${total} enterprise workflow`;
  });

  readonly refreshCounter = signal(0);

  constructor() {
    effect(() => {
      const search = this.querySearch();
      if (search) {
        this.facade.updateFilters({ search });
      }
    });
  }

  ngOnInit(): void {
    this.facade.refresh()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        tap((id) => this.facade.select(id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  updateSearch(search: string): void {
    this.facade.updateFilters({ search });
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search },
      queryParamsHandling: 'merge',
    });
  }

  selectWorkflow(id: string): void {
    this.facade.select(id);
    this.router.navigate(['/enterprise-workflow', id], {
      queryParams: { source: 'dashboard' },
    });
  }

  refresh(): void {
    this.refreshCounter.update((value) => value + 1);
    this.facade.refresh();
  }

  filterByStatus(status: WorkflowStatus | 'all'): void {
    this.facade.updateFilters({ status });
  }

  filterByRisk(risk: WorkflowRiskLevel | 'all'): void {
    this.facade.filterByRisk(risk);
  }

  filterByPriority(priority: WorkflowPriority | 'all'): void {
    this.facade.updateFilters({ priority });
  }
}
