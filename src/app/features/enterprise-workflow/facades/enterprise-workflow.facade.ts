import { Injectable, Signal, computed, inject } from '@angular/core';
import { Observable, firstValueFrom, lastValueFrom } from 'rxjs';

import {
  EnterpriseWorkflow,
  WorkflowFilters,
  WorkflowPriority,
  WorkflowRiskLevel,
  WorkflowStatus,
} from '../models/enterprise-workflow.models';
import { EnterpriseWorkflowStoreService } from '../data-access/enterprise-workflow-store.service';

@Injectable({ providedIn: 'root' })
export class EnterpriseWorkflowFacade {
  private readonly store = inject(EnterpriseWorkflowStoreService);

  readonly workflows: Signal<ReadonlyArray<EnterpriseWorkflow>> = this.store.workflows;
  readonly selectedWorkflow: Signal<EnterpriseWorkflow | null> = this.store.selectedWorkflow;
  readonly metrics = this.store.metrics;
  readonly hasHighRiskWorkflow = computed(() => {
    return this.workflows().some((workflow) => workflow.status === WorkflowStatus.BLOCKED);
  });

  readonly viewModel$ = this.store.viewModel$;

  refresh(): Observable<ReadonlyArray<EnterpriseWorkflow>> {
    this.store.refresh();
    return this.store.workflows$;
  }

  async refreshAndWait(): Promise<ReadonlyArray<EnterpriseWorkflow>> {
    this.store.refresh();
    return firstValueFrom(this.store.workflows$);
  }

  async waitForStableState(): Promise<ReadonlyArray<EnterpriseWorkflow>> {
    return lastValueFrom(this.store.workflows$);
  }

  select(id: string | null): void {
    this.store.select(id);
  }

  updateFilters(filters: Partial<WorkflowFilters>): void {
    this.store.updateFilters(filters);
  }

  updateStatus(id: string, status: WorkflowStatus): void {
    this.store.updateStatus(id, status);
  }

  updatePriority(id: string, priority: WorkflowPriority): void {
    this.store.updatePriority(id, priority);
  }

  filterByRisk(risk: WorkflowRiskLevel | 'all'): void {
    this.store.filterByRisk(risk);
  }
}
