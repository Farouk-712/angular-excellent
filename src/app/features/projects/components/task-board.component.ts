import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ProjectTask, TaskStatus } from '../domain/project.model';

interface TaskColumn {
  readonly status: TaskStatus;
  readonly label: string;
  readonly tasks: readonly ProjectTask[];
}

@Component({
  selector: 'app-task-board',
  standalone: true,
  templateUrl: './task-board.component.html',
  styleUrl: './task-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoardComponent {
  @Input({ required: true }) tasks: readonly ProjectTask[] = [];
  @Output() readonly statusChanged = new EventEmitter<{ readonly taskId: string; readonly status: TaskStatus }>();

  readonly statuses: readonly TaskStatus[] = ['todo', 'doing', 'done'];

  get columns(): readonly TaskColumn[] {
    return this.statuses.map((status) => ({
      status,
      label: this.labelForStatus(status),
      tasks: this.tasks.filter((task) => task.status === status),
    }));
  }

  moveTask(task: ProjectTask, status: TaskStatus): void {
    if (task.status !== status) {
      this.statusChanged.emit({ taskId: task.id, status });
    }
  }

  private labelForStatus(status: TaskStatus): string {
    const labels: Record<TaskStatus, string> = {
      todo: 'À faire',
      doing: 'En cours',
      done: 'Terminé',
    };

    return labels[status];
  }
}
