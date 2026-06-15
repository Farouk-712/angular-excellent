import { Pipe, PipeTransform } from '@angular/core';

import { WorkflowRiskLevel } from '../models/enterprise-workflow.models';

@Pipe({
  name: 'workflowRiskLabel',
  standalone: true,
})
export class WorkflowRiskLabelPipe implements PipeTransform {
  transform(value: WorkflowRiskLevel | string | null | undefined): string {
    switch (value) {
      case WorkflowRiskLevel.LOW:
        return 'Low risk';
      case WorkflowRiskLevel.MEDIUM:
        return 'Medium risk';
      case WorkflowRiskLevel.HIGH:
        return 'High risk';
      case WorkflowRiskLevel.CRITICAL:
        return 'Critical risk';
      default:
        return 'Unknown risk';
    }
  }
}
