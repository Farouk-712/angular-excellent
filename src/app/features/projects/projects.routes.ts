import { Routes } from '@angular/router';

export const PROJECT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/project-list-page.component').then((m) => m.ProjectListPageComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/project-list-page.component').then((m) => m.ProjectListPageComponent),
    data: { openForm: true },
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/project-detail-page.component').then((m) => m.ProjectDetailPageComponent),
  },
];
