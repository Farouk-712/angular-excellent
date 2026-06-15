import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { QualityAuditApiService } from '../data-access/quality-audit-api.service';
import { AuditStatus } from '../models/quality-audit.models';

export const qualityAuditGuard: CanActivateFn = (route): Observable<boolean | UrlTree> => {
  const api = inject(QualityAuditApiService);
  const router = inject(Router);
  const repositoryId = route.queryParamMap.get('repositoryId');

  if (!repositoryId) {
    return of(true);
  }

  return api
    .getAll({
      repositoryId,
      status: AuditStatus.Completed,
      minScore: 0.4,
      text: '',
      pageIndex: 0,
      pageSize: 1,
    })
    .pipe(
      map((page) => (page.total >= 0 ? true : router.createUrlTree(['/quality-audit']))),
      catchError(() => of(router.createUrlTree(['/quality-audit']))),
    );
};
