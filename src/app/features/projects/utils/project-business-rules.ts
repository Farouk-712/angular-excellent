import { Project, ProjectStats, ProjectTask } from '../domain/project.model';

export type ProjectHealth = 'healthy' | 'warning' | 'critical';

export function calculateProjectProgress(tasks: readonly ProjectTask[]): number {
  if (tasks.length === 0) {
    return 0;
  }

  const doneTasks = tasks.filter((task) => task.status === 'done').length;
  return Math.round((doneTasks / tasks.length) * 100);
}

export function calculateWorkloadRatio(tasks: readonly ProjectTask[]): number {
  const estimated = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
  const spent = tasks.reduce((sum, task) => sum + task.spentHours, 0);

  if (estimated === 0) {
    return 0;
  }

  return Number((spent / estimated).toFixed(2));
}

export function isProjectLate(project: Project, today = new Date()): boolean {
  const deadline = new Date(project.dueDate);
  return deadline.getTime() < today.getTime() && calculateProjectProgress(project.tasks) < 100;
}

export function computeProjectHealth(project: Project): ProjectHealth {
  const progress = calculateProjectProgress(project.tasks);
  const workloadRatio = calculateWorkloadRatio(project.tasks);

  if (project.status === 'blocked' || isProjectLate(project) || workloadRatio > 1.3) {
    return 'critical';
  }

  if (progress < 45 || workloadRatio > 1.05) {
    return 'warning';
  }

  return 'healthy';
}

export function computeProjectStats(projects: readonly Project[]): ProjectStats {
  const total = projects.length;
  const active = projects.filter((project) => project.status === 'active').length;
  const blocked = projects.filter((project) => project.status === 'blocked').length;
  const completed = projects.filter((project) => project.status === 'completed').length;
  const totalProgress = projects.reduce((sum, project) => sum + calculateProjectProgress(project.tasks), 0);

  return {
    total,
    active,
    blocked,
    completed,
    averageProgress: total === 0 ? 0 : Math.round(totalProgress / total),
  };
}

export function sortProjectsByPriority(projects: readonly Project[]): readonly Project[] {
  return [...projects].sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));
}
