import { CanActivateFn, CanDeactivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';

export interface DirtyAwareComponent {
  readonly hasUnsavedChanges: () => boolean;
}

export const canEnterEnterpriseWorkflowGuard: CanActivateFn = (): boolean | UrlTree => {
  const router = inject(Router);
  const accessToken = localStorage.getItem('skillevolve.accessToken');

  if (accessToken) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: {
      redirectTo: '/enterprise-workflow',
      reason: 'missing_accessToken',
    },
  });
};

export const canLeaveEnterpriseWorkflowFormGuard: CanDeactivateFn<DirtyAwareComponent> = (
  component,
): boolean => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }

  return confirm('You have unsaved workflow changes. Leave this page?');
};
