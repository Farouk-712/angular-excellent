import { DecimalPipe, KeyValuePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

import { EnterpriseWorkflow, WorkflowRiskLevel } from '../../models/enterprise-workflow.models';
import { calculateWorkflowRisk, summarizeFindingsByCriterion } from '../../utils/enterprise-workflow-scoring.engine';
import { WorkflowRiskLabelPipe } from '../../pipes/workflow-risk-label.pipe';

@Component({
  selector: 'app-workflow-risk-matrix',
  standalone: true,
  imports: [DecimalPipe, KeyValuePipe, NgClass, WorkflowRiskLabelPipe],
  templateUrl: './workflow-risk-matrix.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowRiskMatrixComponent {
  readonly workflow = signal<EnterpriseWorkflow | null>(null);

  @Input({ required: true })
  set value(workflow: EnterpriseWorkflow | null) {
    this.workflow.set(workflow);
  }

  readonly riskSummary = computed(() => {
    const workflow = this.workflow();
    return workflow ? calculateWorkflowRisk(workflow) : null;
  });

  readonly findingsByCriterion = computed(() => {
    const workflow = this.workflow();
    return workflow ? summarizeFindingsByCriterion(workflow.findings) : {};
  });

  riskClass(level: WorkflowRiskLevel): Record<string, boolean> {
    return {
      'bg-emerald-50 text-emerald-700': level === WorkflowRiskLevel.LOW,
      'bg-amber-50 text-amber-700': level === WorkflowRiskLevel.MEDIUM,
      'bg-orange-50 text-orange-700': level === WorkflowRiskLevel.HIGH,
      'bg-rose-50 text-rose-700': level === WorkflowRiskLevel.CRITICAL,
    };
  }
}
