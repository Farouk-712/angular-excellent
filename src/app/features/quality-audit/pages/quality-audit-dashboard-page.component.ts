import { AsyncPipe, CommonModule, DatePipe, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, TrackByFunction, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Observable, combineLatest, debounceTime, distinctUntilChanged, map, shareReplay, tap } from 'rxjs';

import { AuditFilterFormComponent } from '../components/audit-filter-form.component';
import { AuditScoreCardComponent } from '../components/audit-score-card.component';
import { QualityAuditStoreService } from '../data-access/quality-audit-store.service';
import { AuditCriterionScore, AuditDashboardVm, AuditSearchQuery, AuditSession } from '../models/quality-audit.models';

@Component({
  selector: 'app-quality-audit-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    DatePipe,
    PercentPipe,
    RouterLink,
    RouterLinkActive,
    AuditFilterFormComponent,
    AuditScoreCardComponent,
  ],
  templateUrl: './quality-audit-dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QualityAuditDashboardPageComponent {
  private readonly store = inject(QualityAuditStoreService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly compactMode = signal(false);
  protected readonly selectedRepository = signal<string | null>(null);
  protected readonly pageTitle = computed(() =>
    this.compactMode() ? 'Audit qualité' : 'Audit qualité Angular enrichi',
  );

  protected readonly vm$: Observable<AuditDashboardVm> = combineLatest([
    this.store.vm$,
    this.route.queryParams,
    this.route.paramMap,
  ]).pipe(
    debounceTime(80),
    distinctUntilChanged((left, right) => JSON.stringify(left) === JSON.stringify(right)),
    tap(([, queryParams, paramMap]) => {
      const repositoryId = paramMap.get('repositoryId') ?? queryParams['repositoryId'] ?? null;
      this.selectedRepository.set(repositoryId);
    }),
    map(([vm]) => vm),
    takeUntilDestroyed(this.destroyRef),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  protected readonly trackSession: TrackByFunction<AuditSession> = (_index, session) => session.id;
  protected readonly trackCriterion: TrackByFunction<AuditCriterionScore> = (_index, criterion) => criterion.key;

  protected onQueryChanged(query: Partial<AuditSearchQuery>): void {
    this.store.updateQuery(query);
  }

  protected selectSession(session: AuditSession): void {
    this.store.selectSession(session.id);
    this.router.navigate(['./'], {
      relativeTo: this.route,
      queryParams: { sessionId: session.id, repositoryId: session.repositoryId },
      queryParamsHandling: 'merge',
    });
  }

  protected navigateToEditor(session: AuditSession): void {
    this.router.navigate(['../editor', session.id], {
      relativeTo: this.route,
      queryParams: { repositoryId: session.repositoryId },
    });
  }

  protected refresh(): void {
    this.store.refresh();
  }
}
