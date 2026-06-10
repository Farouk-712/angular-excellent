import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { InitialsPipe } from '../../../shared/pipes/initials.pipe';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { Project } from '../domain/project.model';
import { calculateProjectProgress, computeProjectHealth, ProjectHealth } from '../utils/project-business-rules';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [InitialsPipe, NgClass, StatusBadgeComponent],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardComponent {
  @Input({ required: true }) project!: Project;

  @Output() readonly openProject = new EventEmitter<string>();
  @Output() readonly editProject = new EventEmitter<Project>();
  @Output() readonly deleteProject = new EventEmitter<string>();

  progress(project: Project): number {
    return calculateProjectProgress(project.tasks);
  }

  health(project: Project): ProjectHealth {
    return computeProjectHealth(project);
  }
}
