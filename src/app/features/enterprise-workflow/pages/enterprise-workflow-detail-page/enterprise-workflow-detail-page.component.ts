import { AsyncPipe, DatePipe, JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, catchError, map, of, switchMap, takeUntil, tap } from 'rxjs';

import { EnterpriseWorkflowApiService } from '../../data-access/enterprise-workflow-api.service';
import { EnterpriseWorkflowFacade } from '../../facades/enterprise-workflow.facade';
import { WorkflowRiskMatrixComponent } from '../../components/workflow-risk-matrix/workflow-risk-matrix.component';
import { WorkflowKanbanComponent } from '../../components/workflow-kanban/workflow-kanban.component';

@Component({
  selector: 'app-enterprise-workflow-detail-page',
  standalone: true,
  imports: [AsyncPipe, DatePipe, JsonPipe, RouterLink, WorkflowRiskMatrixComponent, WorkflowKanbanComponent],
  templateUrl: './enterprise-workflow-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterpriseWorkflowDetailPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(EnterpriseWorkflowApiService);
  private readonly facade = inject(EnterpriseWorkflowFacade);
  private readonly destroy$ = new Subject<void>();

  readonly workflow$ = this.route.paramMap.pipe(
    map((paramMap) => paramMap.get('id')),
    switchMap((id) => (id ? this.api.findById(id) : of(null))),
    tap((workflow) => this.facade.select(workflow?.id ?? null)),
    catchError(() => {
      this.router.navigateByUrl('/enterprise-workflow');
      return of(null);
    }),
    takeUntil(this.destroy$),
  );

  ngOnInit(): void {
    this.route.queryParams.pipe(
      tap((queryParams) => {
        if (queryParams['source'] === 'dashboard') {
          this.facade.refresh();
        }
      }),
      takeUntil(this.destroy$),
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goEdit(id: string): void {
    this.router.navigate(['/enterprise-workflow', id, 'edit'], {
      queryParams: { mode: 'full' },
    });
  }
}
