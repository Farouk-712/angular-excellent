import {
  EnterpriseWorkflow,
  WorkflowColumn,
  WorkflowDashboardMetrics,
  WorkflowFinding,
  WorkflowPriority,
  WorkflowRiskLevel,
  WorkflowRiskSummary,
  WorkflowStatus,
  WorkflowTask,
  WORKFLOW_COLUMNS,
  WORKFLOW_RISK_WEIGHTS,
} from '../models/enterprise-workflow.models';

const TODAY = new Date();

export function calculateWorkflowRisk(workflow: EnterpriseWorkflow): WorkflowRiskSummary {
  const reasons: string[] = [];
  const recommendedActions: string[] = [];
  const unresolvedFindings = workflow.findings.filter((finding) => !finding.resolved);
  const criticalFindings = unresolvedFindings.filter(
    (finding) => finding.severity === WorkflowRiskLevel.CRITICAL,
  );
  const lateTasks = workflow.tasks.filter((task) => isTaskLate(task));
  const overloadRatio = calculateOverloadRatio(workflow.tasks);

  let score = unresolvedFindings.reduce((total, finding) => {
    return total + WORKFLOW_RISK_WEIGHTS[finding.severity] * Math.max(0.1, finding.scoreImpact);
  }, 0);

  if (criticalFindings.length > 0) {
    score += criticalFindings.length * 0.25;
    reasons.push(`${criticalFindings.length} critical finding(s) are still open`);
    recommendedActions.push('Resolve critical findings before delivery validation');
  }

  if (lateTasks.some((task) => task.priority === WorkflowPriority.URGENT)) {
    score += 0.35;
    reasons.push('At least one urgent task is late');
    recommendedActions.push('Re-plan urgent tasks and assign a reviewer immediately');
  }

  if (overloadRatio >= 1.2) {
    score += 0.2;
    reasons.push('Estimated workload is higher than available capacity');
    recommendedActions.push('Split the workflow into smaller deliverable slices');
  }

  if (workflow.status === WorkflowStatus.BLOCKED) {
    score += 0.3;
    reasons.push('Workflow is currently blocked');
    recommendedActions.push('Escalate blockers to the tech lead');
  }

  const normalizedScore = Math.min(1, Number(score.toFixed(3)));

  return {
    level: mapRiskScoreToLevel(normalizedScore),
    score: normalizedScore,
    reasons: reasons.length ? reasons : ['No major quality risk detected'],
    recommendedActions: recommendedActions.length
      ? recommendedActions
      : ['Continue monitoring quality criteria during reviews'],
  };
}

export function calculateDashboardMetrics(
  workflows: ReadonlyArray<EnterpriseWorkflow>,
): WorkflowDashboardMetrics {
  const totalWorkflows = workflows.length;

  if (totalWorkflows === 0) {
    return {
      totalWorkflows: 0,
      approvedWorkflows: 0,
      blockedWorkflows: 0,
      deliveredWorkflows: 0,
      averageQualityScore: 0,
      averageRiskScore: 0,
      totalOpenFindings: 0,
      lateTasksCount: 0,
      velocity: 0,
      completionRate: 0,
    };
  }

  const riskSummaries = workflows.map(calculateWorkflowRisk);
  const allTasks = workflows.flatMap((workflow) => workflow.tasks);
  const completedTasks = allTasks.filter((task) => task.column === 'done');
  const qualityScores = workflows.map((workflow) => calculateQualityScore(workflow));

  return {
    totalWorkflows,
    approvedWorkflows: workflows.filter((workflow) => workflow.status === WorkflowStatus.APPROVED).length,
    blockedWorkflows: workflows.filter((workflow) => workflow.status === WorkflowStatus.BLOCKED).length,
    deliveredWorkflows: workflows.filter((workflow) => workflow.status === WorkflowStatus.DELIVERED).length,
    averageQualityScore: average(qualityScores),
    averageRiskScore: average(riskSummaries.map((summary) => summary.score)),
    totalOpenFindings: workflows.reduce(
      (total, workflow) => total + workflow.findings.filter((finding) => !finding.resolved).length,
      0,
    ),
    lateTasksCount: allTasks.filter(isTaskLate).length,
    velocity: completedTasks.reduce((total, task) => total + task.estimate, 0),
    completionRate: allTasks.length ? Number((completedTasks.length / allTasks.length).toFixed(3)) : 0,
  };
}

export function groupTasksByColumn(
  tasks: ReadonlyArray<WorkflowTask>,
): Readonly<Record<WorkflowColumn, ReadonlyArray<WorkflowTask>>> {
  return WORKFLOW_COLUMNS.reduce((accumulator, column) => {
    return {
      ...accumulator,
      [column]: tasks
        .filter((task) => task.column === column)
        .sort((first, second) => comparePriority(second.priority, first.priority)),
    };
  }, {} as Record<WorkflowColumn, ReadonlyArray<WorkflowTask>>);
}

export function calculateQualityScore(workflow: EnterpriseWorkflow): number {
  const unresolvedPenalty = workflow.findings
    .filter((finding) => !finding.resolved)
    .reduce((total, finding) => {
      switch (finding.severity) {
        case WorkflowRiskLevel.CRITICAL:
          return total + 0.16;
        case WorkflowRiskLevel.HIGH:
          return total + 0.1;
        case WorkflowRiskLevel.MEDIUM:
          return total + 0.05;
        case WorkflowRiskLevel.LOW:
          return total + 0.02;
        default:
          return total;
      }
    }, 0);

  const taskCompletionBonus = workflow.tasks.length
    ? workflow.tasks.filter((task) => task.column === 'done').length / workflow.tasks.length
    : 0;

  const reviewCoverageBonus = workflow.reviewers.length >= 2 ? 0.08 : 0.03;
  const metadataBonus = Object.entries(workflow.metadata).every(([, value]) => value !== null && value !== '')
    ? 0.04
    : 0;

  return clamp(Number((1 - unresolvedPenalty + taskCompletionBonus * 0.15 + reviewCoverageBonus + metadataBonus).toFixed(3)));
}

export function buildWorkflowDictionary(
  workflows: ReadonlyArray<EnterpriseWorkflow>,
): Readonly<Record<string, EnterpriseWorkflow>> {
  return workflows.reduce((dictionary, workflow) => {
    return {
      ...dictionary,
      [workflow.id]: workflow,
    };
  }, {} as Record<string, EnterpriseWorkflow>);
}

export function filterWorkflows(
  workflows: ReadonlyArray<EnterpriseWorkflow>,
  search: string,
  status: WorkflowStatus | 'all',
  risk: WorkflowRiskLevel | 'all',
  priority: WorkflowPriority | 'all',
  ownerId: string | null,
  onlyLate: boolean,
): ReadonlyArray<EnterpriseWorkflow> {
  const normalizedSearch = search.trim().toLowerCase();

  return workflows
    .filter((workflow) => {
      const riskSummary = calculateWorkflowRisk(workflow);
      const searchableText = [
        workflow.name,
        workflow.repository,
        workflow.owner.fullName,
        ...workflow.tags,
        ...workflow.findings.map((finding) => finding.criterion),
      ].join(' ').toLowerCase();

      if (normalizedSearch && !searchableText.includes(normalizedSearch)) {
        return false;
      }

      if (status !== 'all' && workflow.status !== status) {
        return false;
      }

      if (risk !== 'all' && riskSummary.level !== risk) {
        return false;
      }

      if (priority !== 'all' && workflow.priority !== priority) {
        return false;
      }

      if (ownerId && workflow.owner.id !== ownerId) {
        return false;
      }

      if (onlyLate && !workflow.tasks.some(isTaskLate)) {
        return false;
      }

      return true;
    })
    .sort((first, second) => {
      const riskDifference = calculateWorkflowRisk(second).score - calculateWorkflowRisk(first).score;
      if (riskDifference !== 0) {
        return riskDifference;
      }

      return comparePriority(second.priority, first.priority);
    });
}

export function validateWorkflowBeforeSave(workflow: EnterpriseWorkflow): ReadonlyArray<string> {
  const errors: string[] = [];

  if (!workflow.name.trim()) {
    errors.push('Workflow name is required');
  }

  if (!workflow.repository.includes('/')) {
    errors.push('Repository must use owner/name format');
  }

  if (!Array.isArray(workflow.tasks) || workflow.tasks.length === 0) {
    errors.push('At least one task is required');
  }

  if (workflow.reviewers.length < 1) {
    errors.push('At least one reviewer is required');
  }

  const duplicatedTaskTitles = findDuplicates(workflow.tasks.map((task) => task.title));
  if (duplicatedTaskTitles.length > 0) {
    errors.push(`Duplicated tasks: ${duplicatedTaskTitles.join(', ')}`);
  }

  const missingDependencies = workflow.tasks.some((task) => {
    return task.dependencies.some((dependencyId) => {
      return !workflow.tasks.find((candidate) => candidate.id === dependencyId);
    });
  });

  if (missingDependencies) {
    errors.push('Some task dependencies do not exist in the workflow');
  }

  return errors;
}

export function calculateOverloadRatio(tasks: ReadonlyArray<WorkflowTask>): number {
  const totalEstimate = tasks.reduce((total, task) => total + task.estimate, 0);
  const totalSpent = tasks.reduce((total, task) => total + task.spent, 0);

  if (totalEstimate === 0) {
    return 0;
  }

  return Number((totalSpent / totalEstimate).toFixed(3));
}

export function isTaskLate(task: WorkflowTask): boolean {
  try {
    return new Date(task.dueDate).getTime() < TODAY.getTime() && task.column !== 'done';
  } catch {
    return false;
  }
}

export function summarizeFindingsByCriterion(
  findings: ReadonlyArray<WorkflowFinding>,
): Readonly<Record<string, number>> {
  const map = new Map<string, number>();

  for (const finding of findings) {
    map.set(finding.criterion, (map.get(finding.criterion) ?? 0) + 1);
  }

  return Object.fromEntries(map.entries());
}

function mapRiskScoreToLevel(score: number): WorkflowRiskLevel {
  if (score >= 0.8) {
    return WorkflowRiskLevel.CRITICAL;
  }

  if (score >= 0.55) {
    return WorkflowRiskLevel.HIGH;
  }

  if (score >= 0.3) {
    return WorkflowRiskLevel.MEDIUM;
  }

  return WorkflowRiskLevel.LOW;
}

function comparePriority(first: WorkflowPriority, second: WorkflowPriority): number {
  const order: Record<WorkflowPriority, number> = {
    [WorkflowPriority.LOW]: 1,
    [WorkflowPriority.NORMAL]: 2,
    [WorkflowPriority.HIGH]: 3,
    [WorkflowPriority.URGENT]: 4,
  };

  return order[first] - order[second];
}

function average(values: ReadonlyArray<number>): number {
  if (values.length === 0) {
    return 0;
  }

  return Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(3));
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function findDuplicates(values: ReadonlyArray<string>): ReadonlyArray<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }

    seen.add(value);
  }

  return Array.from(duplicates.values());
}
