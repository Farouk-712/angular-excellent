import { Project } from '../domain/project.model';
import { assessProjectRisk, calculateEstimationDrift, rankProjectsByRisk } from './project-risk-engine';

const baseProject: Project = {
  id: 'project-1',
  name: 'SkillEvolve Dashboard',
  description: 'Angular delivery dashboard',
  owner: 'Nour Ghouila',
  status: 'active',
  priority: 3,
  dueDate: '2026-07-30',
  budget: 42000,
  stack: ['Angular', 'RxJS', 'NestJS'],
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-10T09:00:00.000Z',
  tasks: [
    { id: 'task-1', title: 'Create dashboard shell', status: 'done', assignee: 'Nour', estimatedHours: 8, spentHours: 7 },
    { id: 'task-2', title: 'Add reactive form', status: 'doing', assignee: 'Farouk', estimatedHours: 10, spentHours: 9 },
    { id: 'task-3', title: 'Connect API service', status: 'todo', assignee: 'Yasmine', estimatedHours: 7, spentHours: 0 },
  ],
};

describe('project risk engine', () => {
  it('returns a low risk assessment for a healthy active project', () => {
    const risk = assessProjectRisk(baseProject, new Date('2026-06-20T10:00:00.000Z'));

    expect(risk.score).toBeLessThan(50);
    expect(risk.riskLevel).toBe('low');
    expect(risk.factors.length).toBeGreaterThan(0);
  });

  it('detects blocked projects and deadline pressure', () => {
    const blockedProject: Project = {
      ...baseProject,
      status: 'blocked',
      dueDate: '2026-06-22',
      tasks: baseProject.tasks.map((task) => ({ ...task, status: 'todo', spentHours: task.estimatedHours + 4 })),
    };

    const risk = assessProjectRisk(blockedProject, new Date('2026-06-20T10:00:00.000Z'));

    expect(risk.score).toBeGreaterThanOrEqual(50);
    expect(risk.factors.some((factor) => factor.code === 'blocked-project' && factor.active)).toBeTrue();
  });

  it('ranks projects from the riskiest to the healthiest', () => {
    const criticalProject: Project = {
      ...baseProject,
      id: 'critical',
      status: 'blocked',
      dueDate: '2026-06-21',
    };

    const ranked = rankProjectsByRisk([baseProject, criticalProject]);

    expect(ranked[0].id).toBe('critical');
  });

  it('computes estimation drift in percentage', () => {
    const drift = calculateEstimationDrift([
      { id: 'a', title: 'A', status: 'done', assignee: 'Nour', estimatedHours: 10, spentHours: 15 },
      { id: 'b', title: 'B', status: 'done', assignee: 'Farouk', estimatedHours: 10, spentHours: 5 },
    ]);

    expect(drift).toBe(0);
  });
});
