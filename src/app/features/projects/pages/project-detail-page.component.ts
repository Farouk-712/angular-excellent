import { AsyncPipe, DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { filter, map, switchMap } from 'rxjs';

import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { Project, TaskStatus } from '../domain/project.model';
import { ProjectAnalyticsStoreService } from '../data-access/project-analytics-store.service';
import { ProjectsStoreService } from '../data-access/projects-store.service';
import { ProjectRiskPanelComponent } from '../components/project-risk-panel.component';
import { TaskBoardComponent } from '../components/task-board.component';
import { calculateProjectProgress, calculateWorkloadRatio, computeProjectHealth } from '../utils/project-business-rules';

@Component({
  selector: 'app-project-detail-page',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    DecimalPipe,
    NgClass,
    RouterLink,
    StatusBadgeComponent,
    ProjectRiskPanelComponent,
    TaskBoardComponent,
  ],
  templateUrl: './project-detail-page.component.html',
  styleUrl: './project-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(ProjectsStoreService);
  private readonly analyticsStore = inject(ProjectAnalyticsStoreService);

  readonly projectId$ = this.route.paramMap.pipe(
    map((params) => params.get('id')),
    filter((id): id is string => Boolean(id)),
  );

  readonly project$ = this.projectId$.pipe(switchMap((id) => this.store.projectById$(id)));
  readonly risk$ = this.projectId$.pipe(switchMap((id) => this.analyticsStore.riskForProject$(id)));

  ngOnInit(): void {
    this.store.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.analyticsStore.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  progress(project: Project): number {
    return calculateProjectProgress(project.tasks);
  }

  workload(project: Project): number {
    return calculateWorkloadRatio(project.tasks);
  }

  health(project: Project): string {
    return computeProjectHealth(project);
  }

  updateTaskStatus(project: Project, event: { readonly taskId: string; readonly status: TaskStatus }): void {
    const tasks = project.tasks.map((task) =>
      task.id === event.taskId ? { ...task, status: event.status } : task,
    );

    this.store.update(project.id, {
      name: project.name,
      description: project.description,
      owner: project.owner,
      status: project.status,
      priority: project.priority,
      dueDate: project.dueDate,
      budget: project.budget,
      stack: project.stack,
      tasks: tasks.map(({ title, status, assignee, estimatedHours, spentHours }) => ({
        title,
        status,
        assignee,
        estimatedHours,
        spentHours,
      })),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
