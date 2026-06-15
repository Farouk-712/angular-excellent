import { HttpErrorResponse, HttpHeaders, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';

export const enterpriseWorkflowInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const accessToken = localStorage.getItem(environment.accessTokenStorageKey);
  const refreshToken = localStorage.getItem(environment.refreshTokenStorageKey);

  const headers = new HttpHeaders({
    'X-SkillEvolve-Client': 'enterprise-workflow',
    'X-Requested-With': 'XMLHttpRequest',
  });

  const authenticatedRequest = request.clone({
    withCredentials: true,
    setHeaders: {
      ...headers.keys().reduce((accumulator, key) => {
        return { ...accumulator, [key]: headers.get(key) ?? '' };
      }, {} as Record<string, string>),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(refreshToken ? { 'X-Refresh-Token': refreshToken } : {}),
    },
  });

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        router.navigateByUrl('/login');
      }

      return throwError(() => error);
    }),
  );
};
