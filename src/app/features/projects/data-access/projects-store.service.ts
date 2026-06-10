import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, finalize, map, Observable, shareReplay, tap } from 'rxjs';

import { ToastService } from '../../../core/services/toast.service';
import { Project, ProjectFilters, ProjectListViewModel, ProjectUpsertPayload } from '../domain/project.model';
import { computeProjectStats, sortProjectsByPriority } from '../utils/project-business-rules';
import { ProjectsApiService } from './projects-api.service';

const DEFAULT_FILTERS: ProjectFilters = {
  search: '',
  status: 'all',
  minProgress: 0,
};

@Injectable({ providedIn: 'root' })
export class ProjectsStoreService {
  private readonly api = inject(ProjectsApiService);
  private readonly toastService = inject(ToastService);

  private readonly projectsSubject = new BehaviorSubject<readonly Project[]>([]);
  private readonly filtersSubject = new BehaviorSubject<ProjectFilters>(DEFAULT_FILTERS);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  readonly projects$ = this.projectsSubject.asObservable();
  readonly filters$ = this.filtersSubject.asObservable();
  readonly isLoading$ = this.loadingSubject.asObservable();

  readonly vm$: Observable<ProjectListViewModel> = combineLatest([
    this.projects$,
    this.filters$,
    this.isLoading$,
  ]).pipe(
    map(([projects, filters, isLoading]) => {
      const filteredProjects = this.filterProjects(projects, filters);

      return {
        projects: sortProjectsByPriority(filteredProjects),
        filters,
        stats: computeProjectStats(projects),
        isLoading,
      };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  load(): Observable<readonly Project[]> {
    this.loadingSubject.next(true);

    return this.api.list().pipe(
      tap((projects) => this.projectsSubject.next(projects)),
      finalize(() => this.loadingSubject.next(false)),
    );
  }

  create(payload: ProjectUpsertPayload): Observable<Project> {
    this.loadingSubject.next(true);

    return this.api.create(payload).pipe(
      tap((project) => {
        this.projectsSubject.next([project, ...this.projectsSubject.value]);
        this.toastService.success('Project created', `${project.name} was added successfully.`);
      }),
      finalize(() => this.loadingSubject.next(false)),
    );
  }

  update(id: string, payload: ProjectUpsertPayload): Observable<Project> {
    this.loadingSubject.next(true);

    return this.api.update(id, payload).pipe(
      tap((updatedProject) => {
        const nextProjects = this.projectsSubject.value.map((project) =>
          project.id === id ? updatedProject : project,
        );

        this.projectsSubject.next(nextProjects);
        this.toastService.success('Project updated', `${updatedProject.name} was saved successfully.`);
      }),
      finalize(() => this.loadingSubject.next(false)),
    );
  }

  delete(id: string): Observable<string> {
    this.loadingSubject.next(true);

    return this.api.delete(id).pipe(
      tap(() => {
        this.projectsSubject.next(this.projectsSubject.value.filter((project) => project.id !== id));
        this.toastService.success('Project deleted', 'The project was removed from the dashboard.');
      }),
      finalize(() => this.loadingSubject.next(false)),
    );
  }

  setFilters(filters: Partial<ProjectFilters>): void {
    this.filtersSubject.next({ ...this.filtersSubject.value, ...filters });
  }

  projectById$(id: string): Observable<Project | undefined> {
    return this.projects$.pipe(map((projects) => projects.find((project) => project.id === id)));
  }

  private filterProjects(projects: readonly Project[], filters: ProjectFilters): readonly Project[] {
    const normalizedSearch = filters.search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        project.name.toLowerCase().includes(normalizedSearch) ||
        project.owner.toLowerCase().includes(normalizedSearch) ||
        project.stack.some((technology) => technology.toLowerCase().includes(normalizedSearch));

      const matchesStatus = filters.status === 'all' || project.status === filters.status;

      return matchesSearch && matchesStatus;
    });
  }
}
