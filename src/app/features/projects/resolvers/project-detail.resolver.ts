import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { map, of, switchMap, take } from 'rxjs';

import { Project } from '../domain/project.model';
import { ProjectsStoreService } from '../data-access/projects-store.service';

export const projectDetailResolver: ResolveFn<Project | null> = (route) => {
  const router = inject(Router);
  const store = inject(ProjectsStoreService);
  const projectId = route.paramMap.get('id');

  if (!projectId) {
    router.navigate(['/projects']);
    return of(null);
  }

  return store.projectById$(projectId).pipe(
    take(1),
    switchMap((project) => (project ? of(project) : store.load().pipe(map((projects) => projects.find((item) => item.id === projectId) ?? null)))),
  );
};
