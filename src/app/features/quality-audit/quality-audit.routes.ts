import { Routes } from '@angular/router';

import { qualityAuditGuard } from './guards/quality-audit.guard';
import { qualityAuditResolver } from './resolvers/quality-audit.resolver';

export const QUALITY_AUDIT_ROUTES: Routes = [
  {
    path: '',
    canActivate: [qualityAuditGuard],
    loadComponent: () =>
      import('./pages/quality-audit-dashboard-page.component').then(
        (component) => component.QualityAuditDashboardPageComponent,
      ),
  },
  {
    path: 'editor',
    loadComponent: () =>
      import('./pages/quality-audit-editor-page.component').then(
        (component) => component.QualityAuditEditorPageComponent,
      ),
  },
  {
    path: 'editor/:sessionId',
    canActivate: [qualityAuditGuard],
    resolve: {
      audit: qualityAuditResolver,
    },
    loadComponent: () =>
      import('./pages/quality-audit-editor-page.component').then(
        (component) => component.QualityAuditEditorPageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
