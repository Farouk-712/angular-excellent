import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'projects',
  },
  {
    path: 'projects',
    loadChildren: () => import('./features/projects/projects.routes').then((m) => m.PROJECT_ROUTES),
  },
  {
    path: '**',
    loadComponent: () => import('./shared/ui/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
