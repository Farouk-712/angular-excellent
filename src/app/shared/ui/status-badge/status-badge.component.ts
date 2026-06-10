import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { ProjectStatus } from '../../../features/projects/domain/project.model';
import { StatusLabelPipe } from '../../pipes/status-label.pipe';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass, StatusLabelPipe],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: ProjectStatus;

  readonly statusClass: Record<ProjectStatus, string> = {
    planning: 'badge-planning',
    active: 'badge-active',
    blocked: 'badge-blocked',
    completed: 'badge-completed',
  };
}
