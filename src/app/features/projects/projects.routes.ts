import { Routes } from '@angular/router';

import { projectAccessGuard } from '../../core/guards/project-access.guard';
import { projectDetailResolver } from './resolvers/project-detail.resolver';

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
    path: 'analytics',
    loadComponent: () => import('./pages/project-analytics-page.component').then((m) => m.ProjectAnalyticsPageComponent),
  },
  {
    path: ':id',
    canActivate: [projectAccessGuard],
    resolve: { project: projectDetailResolver },
    loadComponent: () => import('./pages/project-detail-page.component').then((m) => m.ProjectDetailPageComponent),
  },
];
