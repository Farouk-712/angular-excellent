import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  finalize,
  map,
  Observable,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';

import { ToastService } from '../../../core/services/toast.service';
import { ProjectAnalyticsViewModel, ProjectRiskAssessment, SprintCapacitySummary } from '../domain/project-analytics.model';
import { Project } from '../domain/project.model';
import { rankProjectsByRisk } from '../utils/project-risk-engine';
import { summarizePortfolio } from '../utils/portfolio-analytics';
import { ProjectAnalyticsApiService } from './project-analytics-api.service';
import { ProjectsStoreService } from './projects-store.service';

interface AnalyticsQueryState {
  readonly minimumRiskScore: number;
  readonly includeCompleted: boolean;
}

const DEFAULT_QUERY: AnalyticsQueryState = {
  minimumRiskScore: 0,
  includeCompleted: true,
};

const EMPTY_CAPACITY: SprintCapacitySummary = {
  totalCapacity: 0,
  availableCapacity: 0,
  plannedHours: 0,
  utilizationRate: 0,
  remainingHours: 0,
  isOverloaded: false,
};

@Injectable({ providedIn: 'root' })
export class ProjectAnalyticsStoreService {
  private readonly analyticsApi = inject(ProjectAnalyticsApiService);
  private readonly projectsStore = inject(ProjectsStoreService);
  private readonly toastService = inject(ToastService);

  private readonly querySubject = new BehaviorSubject<AnalyticsQueryState>(DEFAULT_QUERY);
  private readonly risksSubject = new BehaviorSubject<readonly ProjectRiskAssessment[]>([]);
  private readonly capacitySubject = new BehaviorSubject<SprintCapacitySummary>(EMPTY_CAPACITY);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  readonly query$ = this.querySubject.asObservable();
  readonly risks$ = this.risksSubject.asObservable();
  readonly capacity$ = this.capacitySubject.asObservable();
  readonly isLoading$ = this.loadingSubject.asObservable();

  readonly vm$: Observable<ProjectAnalyticsViewModel> = combineLatest([
    this.projectsStore.projects$,
    this.query$,
    this.risks$,
    this.capacity$,
  ]).pipe(
    debounceTime(80),
    map(([projects, query, risks, capacity]) => {
      const eligibleProjects = query.includeCompleted
        ? projects
        : projects.filter((project) => project.status !== 'completed');

      return {
        portfolio: summarizePortfolio(eligibleProjects),
        risks: risks.filter((risk) => risk.score >= query.minimumRiskScore),
        capacity,
        topRiskProjects: rankProjectsByRisk(eligibleProjects).slice(0, 3),
        generatedAt: new Date().toISOString(),
      };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  load(): Observable<readonly ProjectRiskAssessment[]> {
    this.loadingSubject.next(true);

    return this.projectsStore.projects$.pipe(
      distinctUntilChanged(),
      switchMap((projects) => this.analyticsApi.loadDashboard(projects)),
      tap(({ risks, capacity }) => {
        this.risksSubject.next(risks);
        this.capacitySubject.next(capacity);
      }),
      map(({ risks }) => risks),
      catchError((error) => {
        this.toastService.error('Analytics unavailable', 'Local fallback analytics could not be prepared.');
        console.error(error);
        return EMPTY;
      }),
      finalize(() => this.loadingSubject.next(false)),
    );
  }

  updateQuery(query: Partial<AnalyticsQueryState>): void {
    this.querySubject.next({ ...this.querySubject.value, ...query });
  }

  riskForProject$(projectId: string): Observable<ProjectRiskAssessment | undefined> {
    return this.risks$.pipe(map((risks) => risks.find((risk) => risk.projectId === projectId)));
  }
}
