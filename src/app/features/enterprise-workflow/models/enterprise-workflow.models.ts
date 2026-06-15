import { Observable, Signal } from 'rxjs';

export enum WorkflowRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum WorkflowStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  BLOCKED = 'blocked',
  DELIVERED = 'delivered',
}

export enum WorkflowPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export type WorkflowColumn = 'backlog' | 'analysis' | 'implementation' | 'review' | 'done';

export interface WorkflowOwner {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly role: 'developer' | 'tech-lead' | 'admin';
  readonly capacityPerWeek: number;
}

export interface WorkflowTask {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly column: WorkflowColumn;
  readonly priority: WorkflowPriority;
  readonly estimate: number;
  readonly spent: number;
  readonly assigneeId: string;
  readonly dueDate: string;
  readonly tags: ReadonlyArray<string>;
  readonly dependencies: ReadonlyArray<string>;
  readonly acceptanceCriteria: ReadonlyArray<string>;
}

export interface WorkflowFinding {
  readonly id: string;
  readonly criterion:
    | 'structure'
    | 'template_quality'
    | 'routing_rendering'
    | 'state_management'
    | 'backend_integration'
    | 'forms'
    | 'business_logic'
    | 'crud'
    | 'rxjs'
    | 'dependency_injection'
    | 'code_hygiene'
    | 'maintainability';
  readonly severity: WorkflowRiskLevel;
  readonly message: string;
  readonly recommendation: string;
  readonly resolved: boolean;
  readonly scoreImpact: number;
}

export interface EnterpriseWorkflow {
  readonly id: string;
  readonly name: string;
  readonly repository: string;
  readonly status: WorkflowStatus;
  readonly priority: WorkflowPriority;
  readonly owner: WorkflowOwner;
  readonly reviewers: ReadonlyArray<WorkflowOwner>;
  readonly tasks: ReadonlyArray<WorkflowTask>;
  readonly findings: ReadonlyArray<WorkflowFinding>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly tags: ReadonlyArray<string>;
  readonly metadata: Readonly<Record<string, string | number | boolean>>;
}

export interface WorkflowFilters {
  readonly search: string;
  readonly status: WorkflowStatus | 'all';
  readonly risk: WorkflowRiskLevel | 'all';
  readonly priority: WorkflowPriority | 'all';
  readonly ownerId: string | null;
  readonly onlyLate: boolean;
}

export interface WorkflowDashboardMetrics {
  readonly totalWorkflows: number;
  readonly approvedWorkflows: number;
  readonly blockedWorkflows: number;
  readonly deliveredWorkflows: number;
  readonly averageQualityScore: number;
  readonly averageRiskScore: number;
  readonly totalOpenFindings: number;
  readonly lateTasksCount: number;
  readonly velocity: number;
  readonly completionRate: number;
}

export interface WorkflowRiskSummary {
  readonly level: WorkflowRiskLevel;
  readonly score: number;
  readonly reasons: ReadonlyArray<string>;
  readonly recommendedActions: ReadonlyArray<string>;
}

export interface WorkflowViewModel {
  readonly loading: boolean;
  readonly saving: boolean;
  readonly error: string | null;
  readonly filters: WorkflowFilters;
  readonly workflows: ReadonlyArray<EnterpriseWorkflow>;
  readonly selectedWorkflow: EnterpriseWorkflow | null;
  readonly metrics: WorkflowDashboardMetrics;
  readonly riskByWorkflow: Readonly<Record<string, WorkflowRiskSummary>>;
}

export interface WorkflowApiPage<T> {
  readonly items: ReadonlyArray<T>;
  readonly total: number;
  readonly pageIndex: number;
  readonly pageSize: number;
}

export type WorkflowCreatePayload = Pick<
  EnterpriseWorkflow,
  'name' | 'repository' | 'priority' | 'owner' | 'reviewers' | 'tags' | 'metadata'
>;

export type WorkflowUpdatePayload = Partial<
  Pick<EnterpriseWorkflow, 'name' | 'status' | 'priority' | 'reviewers' | 'tags' | 'metadata'>
>;

export type WorkflowFormValue = WorkflowCreatePayload & {
  readonly tasks: ReadonlyArray<Omit<WorkflowTask, 'id'>>;
  readonly findings: ReadonlyArray<Omit<WorkflowFinding, 'id'>>;
};

export type EnterpriseWorkflowDictionary = Readonly<Record<string, EnterpriseWorkflow>>;
export type UnknownWorkflowPayload = Readonly<Record<string, unknown>>;
export type WorkflowSignalFacade = Readonly<{
  workflows: Signal<ReadonlyArray<EnterpriseWorkflow>>;
  selectedWorkflow: Signal<EnterpriseWorkflow | null>;
  refresh: () => Observable<ReadonlyArray<EnterpriseWorkflow>>;
}>;

export const WORKFLOW_COLUMNS = [
  'backlog',
  'analysis',
  'implementation',
  'review',
  'done',
] as const satisfies ReadonlyArray<WorkflowColumn>;

export const WORKFLOW_RISK_WEIGHTS: Readonly<Record<WorkflowRiskLevel, number>> = {
  [WorkflowRiskLevel.LOW]: 0.15,
  [WorkflowRiskLevel.MEDIUM]: 0.35,
  [WorkflowRiskLevel.HIGH]: 0.7,
  [WorkflowRiskLevel.CRITICAL]: 1,
} as const;
