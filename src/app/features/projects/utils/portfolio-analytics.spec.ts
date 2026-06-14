import { Project } from '../domain/project.model';
import { summarizePortfolio } from './portfolio-analytics';

const projects: readonly Project[] = [
  {
    id: 'p-1',
    name: 'Alpha',
    description: 'First project',
    owner: 'Nour',
    status: 'active',
    priority: 3,
    dueDate: '2026-07-01',
    budget: 20000,
    stack: ['Angular'],
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
    tasks: [{ id: 't-1', title: 'Done', status: 'done', assignee: 'Nour', estimatedHours: 4, spentHours: 4 }],
  },
  {
    id: 'p-2',
    name: 'Beta',
    description: 'Second project',
    owner: 'Farouk',
    status: 'blocked',
    priority: 1,
    dueDate: '2026-07-15',
    budget: 10000,
    stack: ['RxJS'],
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
    tasks: [{ id: 't-2', title: 'Todo', status: 'todo', assignee: 'Farouk', estimatedHours: 4, spentHours: 0 }],
  },
];

describe('portfolio analytics', () => {
  it('summarizes budget, statuses, priorities and progress', () => {
    const summary = summarizePortfolio(projects);

    expect(summary.totalProjects).toBe(2);
    expect(summary.totalBudget).toBe(30000);
    expect(summary.blockedProjects).toBe(1);
    expect(summary.highPriorityProjects).toBe(1);
    expect(summary.statusDistribution.active).toBe(1);
    expect(summary.priorityDistribution[3]).toBe(1);
  });
});
