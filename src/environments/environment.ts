export const environment = {
  production: false,
  apiUrl: '/api',
  enterpriseWorkflowApi: '/api/enterprise-workflows',
  accessTokenStorageKey: 'skillevolve.accessToken',
  refreshTokenStorageKey: 'skillevolve.refreshToken',
} as const satisfies Record<string, string | boolean>;
