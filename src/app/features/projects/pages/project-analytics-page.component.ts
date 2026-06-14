import { AsyncPipe, DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { MetricCardComponent } from '../../../shared/ui/metric-card/metric-card.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { ProjectAnalyticsStoreService } from '../data-access/project-analytics-store.service';
import { ProjectsStoreService } from '../data-access/projects-store.service';
import { formatBudget } from '../utils/portfolio-analytics';

@Component({
  selector: 'app-project-analytics-page',
  standalone: true,
  imports: [AsyncPipe, DatePipe, DecimalPipe, NgClass, RouterLink, MetricCardComponent, StatusBadgeComponent],
  templateUrl: './project-analytics-page.component.html',
  styleUrl: './project-analytics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectAnalyticsPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly projectsStore = inject(ProjectsStoreService);
  private readonly analyticsStore = inject(ProjectAnalyticsStoreService);

  readonly vm$ = this.analyticsStore.vm$;
  readonly loading$ = this.analyticsStore.isLoading$;

  ngOnInit(): void {
    this.projectsStore.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.analyticsStore.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  updateMinimumRiskScore(value: string): void {
    this.analyticsStore.updateQuery({ minimumRiskScore: Number(value) });
  }

  toggleCompleted(value: boolean): void {
    this.analyticsStore.updateQuery({ includeCompleted: value });
  }

  budget(value: number): string {
    return formatBudget(value);
  }
}
