import { Project, ProjectPriority, ProjectStatus } from '../domain/project.model';
import { PortfolioSummary } from '../domain/project-analytics.model';
import { calculateProjectProgress } from './project-business-rules';

const DEFAULT_STATUS_DISTRIBUTION: Record<ProjectStatus, number> = {
  planning: 0,
  active: 0,
  blocked: 0,
  completed: 0,
};

const DEFAULT_PRIORITY_DISTRIBUTION: Record<ProjectPriority, number> = {
  1: 0,
  2: 0,
  3: 0,
};

export function summarizePortfolio(projects: readonly Project[]): PortfolioSummary {
  const totalBudget = projects.reduce((total, project) => total + project.budget, 0);
  const progressSum = projects.reduce((total, project) => total + calculateProjectProgress(project.tasks), 0);
  const statusDistribution = projects.reduce(
    (distribution, project) => ({ ...distribution, [project.status]: distribution[project.status] + 1 }),
    { ...DEFAULT_STATUS_DISTRIBUTION },
  );
  const priorityDistribution = projects.reduce(
    (distribution, project) => ({ ...distribution, [project.priority]: distribution[project.priority] + 1 }),
    { ...DEFAULT_PRIORITY_DISTRIBUTION },
  );

  return {
    totalProjects: projects.length,
    totalBudget,
    averageProgress: projects.length === 0 ? 0 : Math.round(progressSum / projects.length),
    blockedProjects: statusDistribution.blocked,
    highPriorityProjects: priorityDistribution[3],
    statusDistribution,
    priorityDistribution,
  };
}

export function formatBudget(value: number, currency = 'TND'): string {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
