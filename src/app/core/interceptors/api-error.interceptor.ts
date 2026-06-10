import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { LoggerService } from '../services/logger.service';
import { ToastService } from '../services/toast.service';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const logger = inject(LoggerService);
  const toastService = inject(ToastService);

  const enrichedRequest = request.clone({
    setHeaders: {
      'X-Client-Name': 'project-flow-angular-demo',
    },
  });

  return next(enrichedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      logger.log('error', 'HTTP request failed', {
        url: request.url,
        status: error.status,
        message: error.message,
      });

      if (error.status >= 500) {
        toastService.error('Backend unavailable', 'The app is using the local fallback dataset.');
      }

      return throwError(() => error);
    }),
  );
};
