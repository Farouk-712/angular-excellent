import { NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

import { AutofocusDirective } from '../../../shared/directives/autofocus.directive';
import { Project, ProjectPriority, ProjectStatus, ProjectUpsertPayload, TaskStatus } from '../domain/project.model';

type TaskFormGroup = ReturnType<ProjectFormComponent['createTaskFormGroup']>;

const PROJECT_STATUSES: readonly ProjectStatus[] = ['planning', 'active', 'blocked', 'completed'];
const TASK_STATUSES: readonly TaskStatus[] = ['todo', 'doing', 'done'];
const PRIORITIES: readonly ProjectPriority[] = [1, 2, 3];

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [AutofocusDirective, NgFor, ReactiveFormsModule],
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() project: Project | null = null;
  @Input() isSaving = false;

  @Output() readonly saveProject = new EventEmitter<ProjectUpsertPayload>();
  @Output() readonly cancelEdit = new EventEmitter<void>();

  readonly projectStatuses = PROJECT_STATUSES;
  readonly taskStatuses = TASK_STATUSES;
  readonly priorities = PRIORITIES;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(80)]],
    description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(280)]],
    owner: ['', [Validators.required, Validators.minLength(2)]],
    status: ['planning' as ProjectStatus, Validators.required],
    priority: [2 as ProjectPriority, Validators.required],
    dueDate: ['', Validators.required],
    budget: [5000, [Validators.required, Validators.min(500)]],
    stackText: ['Angular, RxJS, NestJS', [Validators.required, Validators.minLength(3)]],
    tasks: this.fb.array<TaskFormGroup>([], [this.minItemsValidator(1)]),
  });

  get tasks(): FormArray<TaskFormGroup> {
    return this.form.controls.tasks;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['project']) {
      return;
    }

    this.tasks.clear();

    if (!this.project) {
      this.form.reset({
        name: '',
        description: '',
        owner: '',
        status: 'planning',
        priority: 2,
        dueDate: '',
        budget: 5000,
        stackText: 'Angular, RxJS, NestJS',
        tasks: [],
      });
      this.addTask();
      return;
    }

    this.form.patchValue({
      name: this.project.name,
      description: this.project.description,
      owner: this.project.owner,
      status: this.project.status,
      priority: this.project.priority,
      dueDate: this.project.dueDate,
      budget: this.project.budget,
      stackText: this.project.stack.join(', '),
    });

    this.project.tasks.forEach((task) => {
      this.tasks.push(this.createTaskFormGroup(task));
    });
  }

  addTask(): void {
    this.tasks.push(this.createTaskFormGroup());
  }

  removeTask(index: number): void {
    if (this.tasks.length === 1) {
      return;
    }

    this.tasks.removeAt(index);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: ProjectUpsertPayload = {
      name: value.name.trim(),
      description: value.description.trim(),
      owner: value.owner.trim(),
      status: value.status,
      priority: value.priority,
      dueDate: value.dueDate,
      budget: value.budget,
      stack: value.stackText
        .split(',')
        .map((technology) => technology.trim())
        .filter(Boolean),
      tasks: value.tasks.map((task) => ({
        title: task.title.trim(),
        status: task.status,
        assignee: task.assignee.trim(),
        estimatedHours: task.estimatedHours,
        spentHours: task.spentHours,
      })),
    };

    this.saveProject.emit(payload);
  }

  createTaskFormGroup(task?: {
    title: string;
    status: TaskStatus;
    assignee: string;
    estimatedHours: number;
    spentHours: number;
  }) {
    return this.fb.nonNullable.group({
      title: [task?.title ?? '', [Validators.required, Validators.minLength(3)]],
      status: [task?.status ?? 'todo', Validators.required],
      assignee: [task?.assignee ?? '', [Validators.required, Validators.minLength(2)]],
      estimatedHours: [task?.estimatedHours ?? 4, [Validators.required, Validators.min(1), Validators.max(120)]],
      spentHours: [task?.spentHours ?? 0, [Validators.required, Validators.min(0), Validators.max(160)]],
    });
  }

  private minItemsValidator(min: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const array = control as FormArray;
      return array.length >= min ? null : { minItems: { required: min, actual: array.length } };
    };
  }
}
