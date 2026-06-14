import { HttpInterceptorFn } from '@angular/common/http';

const DEMO_TOKEN_KEY = 'skillevolve-demo-token';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const token = localStorage.getItem(DEMO_TOKEN_KEY);

  if (!token || request.headers.has('Authorization')) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'X-Client-Name': 'SkillEvolve Angular Excellence Demo',
      },
    }),
  );
};
