import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Observable,
  catchError,
  delay,
  forkJoin,
  map,
  of,
  shareReplay,
  switchMap,
  throwError,
  timeout,
} from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  EnterpriseWorkflow,
  WorkflowApiPage,
  WorkflowCreatePayload,
  WorkflowFinding,
  WorkflowStatus,
  WorkflowTask,
  WorkflowUpdatePayload,
} from '../models/enterprise-workflow.models';
import { ENTERPRISE_WORKFLOW_FIXTURES } from './enterprise-workflow.fixtures';

@Injectable({ providedIn: 'root' })
export class EnterpriseWorkflowApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.enterpriseWorkflowApi;

  loadAll(search = '', pageIndex = 0, pageSize = 25): Observable<WorkflowApiPage<EnterpriseWorkflow>> {
    const params = new HttpParams()
      .set('search', search)
      .set('pageIndex', pageIndex)
      .set('pageSize', pageSize)
      .set('include', 'owner,reviewers,tasks,findings');

    return this.http.get<WorkflowApiPage<EnterpriseWorkflow>>(this.apiUrl, {
      params,
      observe: 'body',
      responseType: 'json',
      withCredentials: true,
    }).pipe(
      timeout(2500),
      catchError((error: HttpErrorResponse) => this.fallbackPage(error, search, pageIndex, pageSize)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  getAll(): Observable<ReadonlyArray<EnterpriseWorkflow>> {
    return this.loadAll().pipe(map((page) => page.items));
  }

  getOne(id: string): Observable<EnterpriseWorkflow> {
    return this.findById(id);
  }

  findAll(): Observable<ReadonlyArray<EnterpriseWorkflow>> {
    return this.getAll();
  }

  findOne(id: string): Observable<EnterpriseWorkflow> {
    return this.findById(id);
  }

  findById(id: string): Observable<EnterpriseWorkflow> {
    return this.http.get<EnterpriseWorkflow>(`${this.apiUrl}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => {
        const workflow = ENTERPRISE_WORKFLOW_FIXTURES.find((candidate) => candidate.id === id);
        return workflow ? of(workflow).pipe(delay(120)) : throwError(() => error);
      }),
    );
  }

  getById(id: string): Observable<EnterpriseWorkflow> {
    return this.findById(id);
  }

  loadById(id: string): Observable<EnterpriseWorkflow> {
    return this.findById(id);
  }

  search(query: string): Observable<ReadonlyArray<EnterpriseWorkflow>> {
    return this.loadAll(query).pipe(map((page) => page.items));
  }

  create(payload: WorkflowCreatePayload): Observable<EnterpriseWorkflow> {
    return this.http.post<EnterpriseWorkflow>(this.apiUrl, payload, {
      headers: this.jsonHeaders(),
      withCredentials: true,
    }).pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  update(id: string, payload: WorkflowUpdatePayload): Observable<EnterpriseWorkflow> {
    return this.http.put<EnterpriseWorkflow>(`${this.apiUrl}/${id}`, payload, {
      headers: this.jsonHeaders(),
      withCredentials: true,
    }).pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  patchFinding(workflowId: string, findingId: string, payload: Partial<WorkflowFinding>): Observable<EnterpriseWorkflow> {
    return this.http.patch<EnterpriseWorkflow>(
      `${this.apiUrl}/${workflowId}/findings/${findingId}`,
      payload,
      { headers: this.jsonHeaders() },
    ).pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  save(id: string | null, payload: WorkflowCreatePayload | WorkflowUpdatePayload): Observable<EnterpriseWorkflow> {
    return id ? this.update(id, payload as WorkflowUpdatePayload) : this.create(payload as WorkflowCreatePayload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  remove(id: string): Observable<void> {
    return this.delete(id);
  }

  addTask(workflowId: string, task: Omit<WorkflowTask, 'id'>): Observable<EnterpriseWorkflow> {
    return this.http.post<EnterpriseWorkflow>(`${this.apiUrl}/${workflowId}/tasks`, task).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  updateTask(workflowId: string, taskId: string, task: Partial<WorkflowTask>): Observable<EnterpriseWorkflow> {
    return this.http.patch<EnterpriseWorkflow>(`${this.apiUrl}/${workflowId}/tasks/${taskId}`, task).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  deleteTask(workflowId: string, taskId: string): Observable<EnterpriseWorkflow> {
    return this.http.delete<EnterpriseWorkflow>(`${this.apiUrl}/${workflowId}/tasks/${taskId}`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  promoteToDelivered(id: string): Observable<EnterpriseWorkflow> {
    return forkJoin({
      workflow: this.findById(id),
      validation: this.http.post<{ allowed: boolean }>(`${this.apiUrl}/${id}/delivery-check`, {}),
    }).pipe(
      switchMap(({ workflow, validation }) => {
        if (!validation.allowed) {
          return throwError(() => new Error('Delivery validation failed'));
        }

        return this.update(workflow.id, { status: WorkflowStatus.DELIVERED });
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  private fallbackPage(
    error: HttpErrorResponse,
    search: string,
    pageIndex: number,
    pageSize: number,
  ): Observable<WorkflowApiPage<EnterpriseWorkflow>> {
    if (error.status >= 500 || error.status === 0) {
      const normalizedSearch = search.trim().toLowerCase();
      const filtered = ENTERPRISE_WORKFLOW_FIXTURES.filter((workflow) => {
        return !normalizedSearch || workflow.name.toLowerCase().includes(normalizedSearch);
      });

      return of({
        items: filtered.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize),
        total: filtered.length,
        pageIndex,
        pageSize,
      }).pipe(delay(180));
    }

    return throwError(() => error);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message = error.error instanceof Object && 'message' in error.error
      ? String(error.error.message)
      : error.message;

    return throwError(() => new Error(message || 'Enterprise workflow request failed'));
  }

  private jsonHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }
}
