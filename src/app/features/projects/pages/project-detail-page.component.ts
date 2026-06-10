import { AsyncPipe, DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { filter, map, switchMap, tap } from 'rxjs';

import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { Project } from '../domain/project.model';
import { ProjectsStoreService } from '../data-access/projects-store.service';
import { calculateProjectProgress, calculateWorkloadRatio, computeProjectHealth } from '../utils/project-business-rules';

@Component({
  selector: 'app-project-detail-page',
  standalone: true,
  imports: [AsyncPipe, DatePipe, DecimalPipe, NgClass, RouterLink, StatusBadgeComponent],
  templateUrl: './project-detail-page.component.html',
  styleUrl: './project-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(ProjectsStoreService);

  readonly project$ = this.route.paramMap.pipe(
    map((params) => params.get('id')),
    filter((id): id is string => Boolean(id)),
    switchMap((id) => this.store.projectById$(id)),
  );

  ngOnInit(): void {
    this.store.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
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
}




git add .
