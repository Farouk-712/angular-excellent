import { ResolveFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, of, tap } from 'rxjs';

import { EnterpriseWorkflow } from '../models/enterprise-workflow.models';
import { EnterpriseWorkflowApiService } from '../data-access/enterprise-workflow-api.service';
import { EnterpriseWorkflowStoreService } from '../data-access/enterprise-workflow-store.service';

export const enterpriseWorkflowResolver: ResolveFn<EnterpriseWorkflow | null> = (
  route: ActivatedRouteSnapshot,
) => {
  const api = inject(EnterpriseWorkflowApiService);
  const store = inject(EnterpriseWorkflowStoreService);
  const router = inject(Router);
  const id = route.paramMap.get('id');

  if (!id) {
    router.navigate(['/enterprise-workflow'], {
      queryParams: { error: 'missing-workflow-id' },
    });
    return of(null);
  }

  return api.findById(id).pipe(
    tap((workflow) => store.select(workflow.id)),
    catchError(() => {
      router.navigateByUrl('/enterprise-workflow');
      return of(null);
    }),
  );
};
