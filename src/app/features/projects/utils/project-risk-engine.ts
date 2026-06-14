import { Project, ProjectTask } from '../domain/project.model';
import { ProjectRiskAssessment, ProjectRiskFactor, RiskLevel, DeliveryHealth } from '../domain/project-analytics.model';
import { calculateProjectProgress } from './project-business-rules';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function assessProjectRisk(project: Project, now = new Date()): ProjectRiskAssessment {
  const factors = buildRiskFactors(project, now);
  const score = normalizeRiskScore(factors.reduce((total, factor) => total + (factor.active ? factor.weight : 0), 0));

  return {
    projectId: project.id,
    riskLevel: mapRiskScoreToLevel(score),
    health: mapRiskScoreToHealth(score),
    score,
    factors,
    generatedAt: now.toISOString(),
  };
}

export function buildRiskFactors(project: Project, now: Date): readonly ProjectRiskFactor[] {
  const progress = calculateProjectProgress(project.tasks);
  const daysRemaining = getDaysRemaining(project.dueDate, now);
  const overdueTasks = project.tasks.filter((task) => task.status !== 'done' && task.spentHours > task.estimatedHours);
  const openTasks = project.tasks.filter((task) => task.status !== 'done');
  const blockedStatus = project.status === 'blocked';
  const highPriorityLate = project.priority === 3 && daysRemaining <= 7 && progress < 80;
  const unstableEstimation = calculateEstimationDrift(project.tasks) > 25;

  return [
    {
      code: 'blocked-project',
      label: 'Project is currently blocked',
      weight: 32,
      active: blockedStatus,
      recommendation: 'Escalate blocking dependency and create a recovery plan with the tech lead.',
    },
    {
      code: 'deadline-pressure',
      label: 'Deadline is close while progress is still limited',
      weight: 26,
      active: daysRemaining <= 5 && progress < 70,
      recommendation: 'Reduce scope, freeze new features and keep only must-have tasks for delivery.',
    },
    {
      code: 'priority-delay',
      label: 'High-priority project has delivery delay signals',
      weight: 22,
      active: highPriorityLate,
      recommendation: 'Assign senior reviewer and monitor progress daily until the release is stable.',
    },
    {
      code: 'task-overrun',
      label: 'Several tasks are exceeding their estimates',
      weight: 18,
      active: overdueTasks.length >= Math.max(2, Math.ceil(project.tasks.length * 0.25)),
      recommendation: 'Split large tasks, re-estimate complex stories and review implementation blockers.',
    },
    {
      code: 'too-many-open-tasks',
      label: 'Too many open tasks remain in the backlog',
      weight: 14,
      active: openTasks.length > 5 && progress < 60,
      recommendation: 'Prioritize backlog and move non-critical tasks to the next sprint.',
    },
    {
      code: 'estimation-drift',
      label: 'Estimation drift is higher than expected',
      weight: 12,
      active: unstableEstimation,
      recommendation: 'Compare estimated and spent hours during sprint review to improve planning accuracy.',
    },
  ];
}

export function rankProjectsByRisk(projects: readonly Project[]): readonly Project[] {
  return [...projects].sort((left, right) => assessProjectRisk(right).score - assessProjectRisk(left).score);
}

export function calculateEstimationDrift(tasks: readonly ProjectTask[]): number {
  const estimated = tasks.reduce((total, task) => total + task.estimatedHours, 0);
  const spent = tasks.reduce((total, task) => total + task.spentHours, 0);

  if (estimated === 0) {
    return 0;
  }

  return Math.round(((spent - estimated) / estimated) * 100);
}

function getDaysRemaining(dueDate: string, now: Date): number {
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);

  return Math.ceil((due.getTime() - now.getTime()) / DAY_IN_MS);
}

function normalizeRiskScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function mapRiskScoreToLevel(score: number): RiskLevel {
  if (score >= 75) {
    return 'critical';
  }

  if (score >= 50) {
    return 'high';
  }

  if (score >= 25) {
    return 'medium';
  }

  return 'low';
}

function mapRiskScoreToHealth(score: number): DeliveryHealth {
  if (score >= 75) {
    return 'risky';
  }

  if (score >= 50) {
    return 'attention';
  }

  if (score >= 25) {
    return 'healthy';
  }

  return 'excellent';
}
