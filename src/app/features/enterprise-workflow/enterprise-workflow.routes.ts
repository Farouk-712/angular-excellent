import { Routes } from '@angular/router';

import {
  canEnterEnterpriseWorkflowGuard,
  canLeaveEnterpriseWorkflowFormGuard,
} from './guards/enterprise-workflow.guard';
import { enterpriseWorkflowResolver } from './resolvers/enterprise-workflow.resolver';

export const ENTERPRISE_WORKFLOW_ROUTES: Routes = [
  {
    path: '',
    canActivate: [canEnterEnterpriseWorkflowGuard],
    loadComponent: () =>
      import('./pages/enterprise-workflow-dashboard-page/enterprise-workflow-dashboard-page.component')
        .then((component) => component.EnterpriseWorkflowDashboardPageComponent),
  },
  {
    path: 'new',
    canActivate: [canEnterEnterpriseWorkflowGuard],
    canDeactivate: [canLeaveEnterpriseWorkflowFormGuard],
    loadComponent: () =>
      import('./pages/enterprise-workflow-edit-page/enterprise-workflow-edit-page.component')
        .then((component) => component.EnterpriseWorkflowEditPageComponent),
  },
  {
    path: ':id',
    canActivate: [canEnterEnterpriseWorkflowGuard],
    resolve: {
      workflow: enterpriseWorkflowResolver,
    },
    loadComponent: () =>
      import('./pages/enterprise-workflow-detail-page/enterprise-workflow-detail-page.component')
        .then((component) => component.EnterpriseWorkflowDetailPageComponent),
  },
  {
    path: ':id/edit',
    canActivate: [canEnterEnterpriseWorkflowGuard],
    canDeactivate: [canLeaveEnterpriseWorkflowFormGuard],
    resolve: {
      workflow: enterpriseWorkflowResolver,
    },
    loadComponent: () =>
      import('./pages/enterprise-workflow-edit-page/enterprise-workflow-edit-page.component')
        .then((component) => component.EnterpriseWorkflowEditPageComponent),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
