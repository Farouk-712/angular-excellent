import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';

import { ProjectsStoreService } from '../../features/projects/data-access/projects-store.service';

export const projectAccessGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const store = inject(ProjectsStoreService);
  const projectId = route.paramMap.get('id');

  if (!projectId) {
    return router.createUrlTree(['/projects']);
  }

  return store.projects$.pipe(
    take(1),
    map((projects) => {
      if (projects.length === 0) {
        return true;
      }

      const exists = projects.some((project) => project.id === projectId);
      return exists ? true : router.createUrlTree(['/projects']);
    }),
  );
};
