import { Pipe, PipeTransform } from '@angular/core';

import { ProjectStatus } from '../../features/projects/domain/project.model';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  blocked: 'Blocked',
  completed: 'Completed',
};

@Pipe({
  name: 'statusLabel',
  standalone: true,
})
export class StatusLabelPipe implements PipeTransform {
  transform(status: ProjectStatus): string {
    return STATUS_LABELS[status] ?? 'Unknown';
  }
}
