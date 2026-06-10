import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, delay, map, Observable, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Project, ProjectUpsertPayload } from '../domain/project.model';
import { MOCK_PROJECTS } from './mock-projects';

@Injectable({ providedIn: 'root' })
export class ProjectsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/projects`;

  list(): Observable<readonly Project[]> {
    return this.http.get<readonly Project[]>(this.baseUrl).pipe(
      catchError(() => of(MOCK_PROJECTS)),
      delay(180),
    );
  }

  create(payload: ProjectUpsertPayload): Observable<Project> {
    const localProject = this.toProject(payload);

    return this.http.post<Project>(this.baseUrl, payload).pipe(
      catchError(() => of(localProject)),
      delay(180),
    );
  }

  update(id: string, payload: ProjectUpsertPayload): Observable<Project> {
    const updatedProject = this.toProject(payload, id);

    return this.http.put<Project>(`${this.baseUrl}/${id}`, payload).pipe(
      catchError(() => of(updatedProject)),
      delay(180),
    );
  }

  delete(id: string): Observable<string> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      map(() => id),
      catchError(() => of(id)),
      delay(120),
    );
  }

  private toProject(payload: ProjectUpsertPayload, id = crypto.randomUUID()): Project {
    const now = new Date().toISOString();

    return {
      id,
      ...payload,
      tasks: payload.tasks.map((task) => ({ ...task, id: crypto.randomUUID() })),
      createdAt: now,
      updatedAt: now,
    };
  }
}
