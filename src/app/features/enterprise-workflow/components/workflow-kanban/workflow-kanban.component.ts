import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';

import {
  WorkflowColumn,
  WorkflowTask,
  WORKFLOW_COLUMNS,
} from '../../models/enterprise-workflow.models';
import { groupTasksByColumn, isTaskLate } from '../../utils/enterprise-workflow-scoring.engine';

@Component({
  selector: 'app-workflow-kanban',
  standalone: true,
  imports: [AsyncPipe, DatePipe, NgClass],
  templateUrl: './workflow-kanban.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowKanbanComponent {
  private readonly tasksSubject = new BehaviorSubject<ReadonlyArray<WorkflowTask>>([]);
  private readonly searchSubject = new BehaviorSubject<string>('');

  @Input()
  set tasks(value: ReadonlyArray<WorkflowTask>) {
    this.tasksSubject.next(value);
  }

  @Output() readonly columnChanged = new EventEmitter<{ taskId: string; column: WorkflowColumn }>();

  readonly columns = WORKFLOW_COLUMNS;

  readonly groupedTasks$: Observable<Readonly<Record<WorkflowColumn, ReadonlyArray<WorkflowTask>>>> =
    combineLatest([this.tasksSubject.asObservable(), this.searchSubject.asObservable()]).pipe(
      map(([tasks, search]) => {
        const normalized = search.trim().toLowerCase();
        const filtered = normalized
          ? tasks.filter((task) => task.title.toLowerCase().includes(normalized))
          : tasks;

        return groupTasksByColumn(filtered);
      }),
    );

  updateSearch(search: string): void {
    this.searchSubject.next(search);
  }

  move(task: WorkflowTask, column: WorkflowColumn): void {
    if (task.column === column) {
      return;
    }

    this.columnChanged.emit({ taskId: task.id, column });
  }

  trackByTaskId(index: number, task: WorkflowTask): string {
    return `${index}-${task.id}`;
  }

  taskClass(task: WorkflowTask): Record<string, boolean> {
    return {
      'border-rose-300 bg-rose-50': isTaskLate(task),
      'border-slate-200 bg-white': !isTaskLate(task),
    };
  }
}
