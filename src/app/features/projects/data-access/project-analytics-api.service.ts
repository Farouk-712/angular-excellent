import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, delay, forkJoin, map, Observable, of, timeout } from 'rxjs';

import { API_URL } from '../../../core/tokens/api-url.token';
import { Project } from '../domain/project.model';
import { ProjectRiskAssessment, SprintCapacitySummary } from '../domain/project-analytics.model';
import { assessProjectRisk } from '../utils/project-risk-engine';
import { createBalancedCapacityPlan, summarizeSprintCapacity } from '../utils/capacity-planning';

interface ApiRiskResponse {
  readonly items: readonly ProjectRiskAssessment[];
}

@Injectable({ providedIn: 'root' })
export class ProjectAnalyticsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  loadRiskAssessments(projects: readonly Project[], minimumScore = 0): Observable<readonly ProjectRiskAssessment[]> {
    const params = new HttpParams().set('minimumScore', minimumScore).set('source', 'angular-dashboard');

    return this.http.get<ApiRiskResponse>(`${this.apiUrl}/project-analytics/risks`, { params }).pipe(
      timeout(1500),
      map((response) => response.items.filter((risk) => risk.score >= minimumScore)),
      catchError(() => of(projects.map((project) => assessProjectRisk(project)).filter((risk) => risk.score >= minimumScore))),
      delay(120),
    );
  }

  loadCapacitySummary(): Observable<SprintCapacitySummary> {
    return this.http.get<SprintCapacitySummary>(`${this.apiUrl}/project-analytics/capacity/current`).pipe(
      timeout(1500),
      catchError(() => of(summarizeSprintCapacity(createBalancedCapacityPlan()))),
      delay(120),
    );
  }

  loadDashboard(projects: readonly Project[]): Observable<{
    readonly risks: readonly ProjectRiskAssessment[];
    readonly capacity: SprintCapacitySummary;
  }> {
    return forkJoin({
      risks: this.loadRiskAssessments(projects),
      capacity: this.loadCapacitySummary(),
    });
  }
}
