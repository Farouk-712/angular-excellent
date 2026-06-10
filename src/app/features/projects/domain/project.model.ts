export type ProjectStatus = 'planning' | 'active' | 'blocked' | 'completed';
export type ProjectPriority = 1 | 2 | 3;
export type TaskStatus = 'todo' | 'doing' | 'done';

export interface ProjectTask {
  readonly id: string;
  readonly title: string;
  readonly status: TaskStatus;
  readonly assignee: string;
  readonly estimatedHours: number;
  readonly spentHours: number;
}

export interface Project {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly owner: string;
  readonly status: ProjectStatus;
  readonly priority: ProjectPriority;
  readonly dueDate: string;
  readonly budget: number;
  readonly stack: readonly string[];
  readonly tasks: readonly ProjectTask[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ProjectFilters {
  readonly search: string;
  readonly status: ProjectStatus | 'all';
  readonly minProgress: number;
}

export interface ProjectStats {
  readonly total: number;
  readonly active: number;
  readonly blocked: number;
  readonly completed: number;
  readonly averageProgress: number;
}

export interface ProjectUpsertPayload {
  readonly name: string;
  readonly description: string;
  readonly owner: string;
  readonly status: ProjectStatus;
  readonly priority: ProjectPriority;
  readonly dueDate: string;
  readonly budget: number;
  readonly stack: readonly string[];
  readonly tasks: readonly Omit<ProjectTask, 'id'>[];
}

export interface ProjectListViewModel {
  readonly projects: readonly Project[];
  readonly filters: ProjectFilters;
  readonly stats: ProjectStats;
  readonly isLoading: boolean;
}
