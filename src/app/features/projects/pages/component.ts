import { AsyncPipe, JsonPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, map, startWith, tap } from 'rxjs';

import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { ProjectCardComponent } from '../components/project-card.component';
import { ProjectFormComponent } from '../components/project-form.component';
import { Project, ProjectStatus, ProjectUpsertPayload } from '../domain/project.model';
import { ProjectsStoreService } from '../data-access/projects-store.service';

@Component({
  selector: 'app-project-list-page',
  standalone: true,
  imports: [AsyncPipe, EmptyStateComponent, NgIf, ProjectCardComponent, ProjectFormComponent, ReactiveFormsModule],
  templateUrl: './project-list-page.component.html',
  styleUrl: './project-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectListPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(ProjectsStoreService);

  readonly vm$ = this.store.vm$;
  readonly statusOptions: readonly (ProjectStatus | 'all')[] = ['all', 'planning', 'active', 'blocked', 'completed'];

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<ProjectStatus | 'all'>('all', { nonNullable: true });

  selectedProject: Project | null = null;
  showForm = false;

  ngOnInit(): void {
    this.store.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    this.route.data
      .pipe(
        map((data) => Boolean(data['openForm'])),
        tap((openForm) => (this.showForm = openForm)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.searchControl.valueChanges
      .pipe(
        startWith(this.searchControl.value),
        debounceTime(250),
        distinctUntilChanged(),
        tap((search) => this.store.setFilters({ search })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.statusControl.valueChanges
      .pipe(
        startWith(this.statusControl.value),
        distinctUntilChanged(),
        tap((status) => this.store.setFilters({ status })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  createNewProject(): void {
    this.selectedProject = null;
    this.showForm = true;
  }

  editProject(project: Project): void {
    this.selectedProject = project;
    this.showForm = true;
  }

  saveProject(payload: ProjectUpsertPayload): void {
    const request$ = this.selectedProject
      ? this.store.update(this.selectedProject.id, payload)
      : this.store.create(payload);

    request$
      .pipe(
        tap(() => {
          this.showForm = false;
          this.selectedProject = null;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  deleteProject(id: string): void {
    this.store.delete(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  openProject(id: string): void {
    void this.router.navigate(['/projects', id]);
  }

  cancelEdit(): void {
    this.selectedProject = null;
    this.showForm = false;
  }
}
