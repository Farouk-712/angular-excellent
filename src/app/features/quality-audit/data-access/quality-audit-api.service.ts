import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, delay, map, of, shareReplay, throwError, timeout } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AuditPage,
  AuditSearchQuery,
  AuditSession,
  AuditStatus,
  CreateAuditRequest,
  UpdateFindingRequest,
} from '../models/quality-audit.models';
import { buildAuditSummary, createExcellentCriteria } from '../utils/quality-audit-rules';

@Injectable({ providedIn: 'root' })
export class QualityAuditApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/quality-audits`;
  private readonly requestHeaders = new HttpHeaders({
    'X-Feature': 'quality-audit',
    'X-Client': 'skillevolve-angular',
  });

  getAll(query: AuditSearchQuery): Observable<AuditPage<AuditSession>> {
    const params = this.buildSearchParams(query);

    return this.http
      .get<AuditPage<AuditSession>>(this.apiUrl, {
        params,
        headers: this.requestHeaders,
        observe: 'body',
        responseType: 'json',
        withCredentials: true,
      })
      .pipe(
        timeout(6000),
        map((page) => ({
          ...page,
          items: page.items.map((session) => this.normalizeSession(session)),
        })),
        catchError((error: HttpErrorResponse) => this.handleFallbackPage(error, query)),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
  }

  getById(id: string): Observable<AuditSession> {
    return this.http
      .get<AuditSession>(`${this.apiUrl}/${id}`, {
        headers: this.requestHeaders,
        withCredentials: true,
      })
      .pipe(
        timeout(6000),
        map((session) => this.normalizeSession(session)),
        catchError((error: HttpErrorResponse) => this.handleFallbackSession(error, id)),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
  }

  create(request: CreateAuditRequest): Observable<AuditSession> {
    return this.http
      .post<AuditSession>(this.apiUrl, request, {
        headers: this.requestHeaders,
        withCredentials: true,
      })
      .pipe(
        map((session) => this.normalizeSession(session)),
        catchError((error: HttpErrorResponse) => this.handleMutationError(error)),
      );
  }

  update(id: string, request: Partial<CreateAuditRequest>): Observable<AuditSession> {
    return this.http
      .put<AuditSession>(`${this.apiUrl}/${id}`, request, {
        headers: this.requestHeaders,
        withCredentials: true,
      })
      .pipe(
        map((session) => this.normalizeSession(session)),
        catchError((error: HttpErrorResponse) => this.handleMutationError(error)),
      );
  }

  patchFinding(sessionId: string, findingId: string, request: UpdateFindingRequest): Observable<AuditSession> {
    return this.http
      .patch<AuditSession>(`${this.apiUrl}/${sessionId}/findings/${findingId}`, request, {
        headers: this.requestHeaders,
        withCredentials: true,
      })
      .pipe(
        map((session) => this.normalizeSession(session)),
        catchError((error: HttpErrorResponse) => this.handleMutationError(error)),
      );
  }

  delete(sessionId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${sessionId}`, {
        headers: this.requestHeaders,
        withCredentials: true,
      })
      .pipe(catchError((error: HttpErrorResponse) => this.handleMutationError(error)));
  }

  private buildSearchParams(query: AuditSearchQuery): HttpParams {
    let params = new HttpParams()
      .set('pageIndex', query.pageIndex)
      .set('pageSize', query.pageSize);

    if (query.repositoryId) {
      params = params.set('repositoryId', query.repositoryId);
    }

    if (query.status) {
      params = params.set('status', query.status);
    }

    if (query.severity) {
      params = params.set('severity', query.severity);
    }

    if (query.minScore !== undefined) {
      params = params.set('minScore', query.minScore);
    }

    if (query.text?.trim()) {
      params = params.set('text', query.text.trim());
    }

    return params;
  }

  private normalizeSession(session: AuditSession): AuditSession {
    const summary = buildAuditSummary(session);

    return {
      ...session,
      summary,
      criteria: [...session.criteria].sort((left, right) => right.score - left.score),
      findings: [...session.findings].sort((left, right) => left.filePath.localeCompare(right.filePath)),
    };
  }

  private handleFallbackPage(error: HttpErrorResponse, query: AuditSearchQuery): Observable<AuditPage<AuditSession>> {
    if (error.status >= 500 || error.status === 0) {
      const items = this.buildLocalSessions().filter((session) => {
        const statusMatches = query.status ? session.status === query.status : true;
        const textMatches = query.text ? session.repositoryName.toLowerCase().includes(query.text.toLowerCase()) : true;
        const scoreMatches = query.minScore !== undefined ? session.summary.globalScore >= query.minScore : true;

        return statusMatches && textMatches && scoreMatches;
      });

      return of({
        items,
        total: items.length,
        pageIndex: query.pageIndex,
        pageSize: query.pageSize,
      }).pipe(delay(180));
    }

    return throwError(() => error);
  }

  private handleFallbackSession(error: HttpErrorResponse, id: string): Observable<AuditSession> {
    const fallback = this.buildLocalSessions().find((session) => session.id === id);

    if (fallback && (error.status === 404 || error.status === 0)) {
      return of(fallback).pipe(delay(120));
    }

    return throwError(() => error);
  }

  private handleMutationError<T>(error: HttpErrorResponse): Observable<T> {
    const message = error.error?.message ?? error.message ?? 'Erreur serveur pendant la sauvegarde de l audit.';
    return throwError(() => new Error(message));
  }

  private buildLocalSessions(): ReadonlyArray<AuditSession> {
    const criteria = createExcellentCriteria();
    const session: AuditSession = {
      id: 'audit-demo-001',
      repositoryId: 'repo-angular-excellent',
      repositoryName: 'skillevolve-angular-excellent-demo',
      branchName: 'main',
      status: AuditStatus.Completed,
      owner: {
        id: 'tech-lead-001',
        fullName: 'Nour Ghouila',
        role: 'tech-lead',
      },
      reviewers: [
        {
          id: 'developer-001',
          fullName: 'Angular Reviewer',
          role: 'developer',
        },
      ],
      criteria,
      findings: [],
      summary: {
        globalScore: 0,
        maintainabilityIndex: 0,
        technicalDebtHours: 0,
        criticalFindings: 0,
        completedFindings: 0,
        totalFindings: 0,
        generatedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return [{ ...session, summary: buildAuditSummary(session) }];
  }
}
