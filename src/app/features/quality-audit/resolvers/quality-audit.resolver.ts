import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';

import { QualityAuditApiService } from '../data-access/quality-audit-api.service';
import { AuditSession } from '../models/quality-audit.models';

export const qualityAuditResolver: ResolveFn<AuditSession | null> = (route): Observable<AuditSession | null> => {
  const api = inject(QualityAuditApiService);
  const sessionId = route.paramMap.get('sessionId');

  if (!sessionId) {
    return of(null);
  }

  return api.getById(sessionId).pipe(catchError(() => of(null)));
};
