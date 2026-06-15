export enum AuditSeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export enum AuditStatus {
  Draft = 'draft',
  Running = 'running',
  Completed = 'completed',
  Archived = 'archived',
}

export enum AuditCriterionKey {
  Structure = 'structure',
  TemplateQuality = 'template_quality',
  RoutingRendering = 'routing_rendering',
  StateManagement = 'state_management',
  BackendIntegration = 'backend_integration',
  Forms = 'forms',
  BusinessLogic = 'business_logic',
  Crud = 'crud',
  Rxjs = 'rxjs',
  DependencyInjection = 'dependency_injection',
  CodeHygiene = 'code_hygiene',
  Maintainability = 'maintainability',
}

export interface AuditCriterionScore {
  readonly key: AuditCriterionKey;
  readonly label: string;
  readonly score: number;
  readonly weight: number;
  readonly severity: AuditSeverity;
  readonly explanation: string;
  readonly signals: ReadonlyArray<string>;
  readonly recommendations: ReadonlyArray<string>;
}

export interface AuditFinding {
  readonly id: string;
  readonly criterion: AuditCriterionKey;
  readonly filePath: string;
  readonly lineStart: number;
  readonly lineEnd: number;
  readonly severity: AuditSeverity;
  readonly message: string;
  readonly suggestion: string;
  readonly resolved: boolean;
}

export interface AuditSummary {
  readonly globalScore: number;
  readonly maintainabilityIndex: number;
  readonly technicalDebtHours: number;
  readonly criticalFindings: number;
  readonly completedFindings: number;
  readonly totalFindings: number;
  readonly generatedAt: string;
}

export interface AuditReviewer {
  readonly id: string;
  readonly fullName: string;
  readonly role: 'developer' | 'tech-lead' | 'admin';
  readonly avatarUrl?: string;
}

export interface AuditSession {
  readonly id: string;
  readonly repositoryId: string;
  readonly repositoryName: string;
  readonly branchName: string;
  readonly status: AuditStatus;
  readonly owner: AuditReviewer;
  readonly reviewers: ReadonlyArray<AuditReviewer>;
  readonly criteria: ReadonlyArray<AuditCriterionScore>;
  readonly findings: ReadonlyArray<AuditFinding>;
  readonly summary: AuditSummary;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AuditChecklistItem {
  readonly id: string;
  readonly label: string;
  readonly criterion: AuditCriterionKey;
  readonly checked: boolean;
  readonly required: boolean;
}

export interface AuditChecklistValue {
  readonly items: ReadonlyArray<AuditChecklistItem>;
  readonly completedCount: number;
  readonly requiredCompletionRate: number;
}

export interface AuditSearchQuery {
  readonly repositoryId?: string;
  readonly status?: AuditStatus;
  readonly severity?: AuditSeverity;
  readonly minScore?: number;
  readonly text?: string;
  readonly pageIndex: number;
  readonly pageSize: number;
}

export interface AuditPage<T> {
  readonly items: ReadonlyArray<T>;
  readonly total: number;
  readonly pageIndex: number;
  readonly pageSize: number;
}

export interface CreateAuditRequest {
  readonly repositoryId: string;
  readonly branchName: string;
  readonly reviewers: ReadonlyArray<string>;
  readonly checklist: AuditChecklistValue;
}

export interface UpdateFindingRequest {
  readonly resolved: boolean;
  readonly suggestion: string;
}

export interface AuditDashboardVm {
  readonly sessions: ReadonlyArray<AuditSession>;
  readonly selectedSession: AuditSession | null;
  readonly summary: AuditSummary;
  readonly criteria: ReadonlyArray<AuditCriterionScore>;
  readonly criticalFindings: ReadonlyArray<AuditFinding>;
  readonly loading: boolean;
  readonly errorMessage: string | null;
  readonly query: AuditSearchQuery;
}
