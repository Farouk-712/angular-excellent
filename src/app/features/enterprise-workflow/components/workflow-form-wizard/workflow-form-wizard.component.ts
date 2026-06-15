import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, inject, signal } from '@angular/core';
import { JsonPipe, NgClass } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith, tap } from 'rxjs';

import {
  WorkflowPriority,
  WorkflowRiskLevel,
  WorkflowStatus,
} from '../../models/enterprise-workflow.models';
import { repositoryNameValidator, workflowNameValidators } from '../../validators/enterprise-workflow.validators';
import { MaturityLevelControlComponent } from '../maturity-level-control/maturity-level-control.component';

@Component({
  selector: 'app-workflow-form-wizard',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, JsonPipe, MaturityLevelControlComponent],
  templateUrl: './workflow-form-wizard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowFormWizardComponent {
  private readonly fb = inject(FormBuilder);
  private readonly nonNullable = inject(NonNullableFormBuilder);

  @Output() readonly submitted = new EventEmitter<unknown>();

  readonly currentStep = signal(0);
  readonly isEditing = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly priorities = Object.values(WorkflowPriority);
  readonly riskLevels = Object.values(WorkflowRiskLevel);
  readonly statuses = Object.values(WorkflowStatus);

  readonly form = this.nonNullable.group({
    name: this.nonNullable.control('', workflowNameValidators),
    repository: this.nonNullable.control('', [Validators.required, repositoryNameValidator()]),
    status: this.nonNullable.control(WorkflowStatus.DRAFT, Validators.required),
    priority: this.nonNullable.control(WorkflowPriority.NORMAL, Validators.required),
    maturity: this.nonNullable.control<'low' | 'intermediate' | 'good' | 'advanced'>('good', Validators.required),
    owner: this.nonNullable.group({
      id: this.nonNullable.control('u-001', Validators.required),
      fullName: this.nonNullable.control('Nour Ghouila', Validators.required),
      email: this.nonNullable.control('nourghouila57@gmail.com', [Validators.required, Validators.email]),
      role: this.nonNullable.control<'developer' | 'tech-lead' | 'admin'>('developer', Validators.required),
      capacityPerWeek: this.nonNullable.control(20, [Validators.required, Validators.min(1), Validators.max(60)]),
    }),
    reviewers: this.fb.array([this.createReviewerGroup()]),
    tasks: this.fb.array([this.createTaskGroup()]),
    findings: this.fb.array([this.createFindingGroup()]),
  });

  readonly completionPercent = computed(() => {
    const validControls = Object.values(this.form.controls).filter((control) => control.valid).length;
    const totalControls = Object.values(this.form.controls).length;
    return Math.round((validControls / totalControls) * 100);
  });

  readonly formValue$ = this.form.valueChanges.pipe(
    startWith(this.form.getRawValue()),
    debounceTime(150),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    tap(() => this.form.updateValueAndValidity({ emitEvent: false })),
  );

  get reviewers(): FormArray<FormGroup> {
    return this.form.controls.reviewers;
  }

  get tasks(): FormArray<FormGroup> {
    return this.form.controls.tasks;
  }

  get findings(): FormArray<FormGroup> {
    return this.form.controls.findings;
  }

  createReviewerGroup(): FormGroup {
    return this.fb.group({
      id: new FormControl(`reviewer-${Date.now()}`, { nonNullable: true, validators: [Validators.required] }),
      fullName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      role: new FormControl<'developer' | 'tech-lead' | 'admin'>('tech-lead', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      capacityPerWeek: new FormControl(8, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1), Validators.max(40)],
      }),
    });
  }

  createTaskGroup(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(4)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      column: ['backlog', Validators.required],
      priority: [WorkflowPriority.NORMAL, Validators.required],
      estimate: [3, [Validators.required, Validators.min(1)]],
      spent: [0, [Validators.required, Validators.min(0)]],
      assigneeId: ['u-001', Validators.required],
      dueDate: ['', Validators.required],
      tags: this.fb.array([this.fb.control('angular', Validators.required)]),
      dependencies: this.fb.array([]),
      acceptanceCriteria: this.fb.array([this.fb.control('Reviewed by tech lead', Validators.required)]),
    });
  }

  createFindingGroup(): FormGroup {
    return this.fb.group({
      criterion: ['maintainability', Validators.required],
      severity: [WorkflowRiskLevel.LOW, Validators.required],
      message: ['', [Validators.required, Validators.minLength(8)]],
      recommendation: ['', [Validators.required, Validators.minLength(8)]],
      resolved: [false],
      scoreImpact: [0.1, [Validators.required, Validators.min(0), Validators.max(1)]],
    });
  }

  nextStep(): void {
    if (this.currentStep() >= 2) {
      return;
    }

    this.currentStep.update((step) => step + 1);
  }

  previousStep(): void {
    if (this.currentStep() <= 0) {
      return;
    }

    this.currentStep.update((step) => step - 1);
  }

  addReviewer(): void {
    this.reviewers.push(this.createReviewerGroup());
    this.reviewers.markAsDirty();
  }

  addTask(): void {
    this.tasks.push(this.createTaskGroup());
    this.tasks.updateValueAndValidity();
  }

  addFinding(): void {
    this.findings.push(this.createFindingGroup());
    this.findings.markAsTouched();
  }

  removeReviewer(index: number): void {
    this.reviewers.removeAt(index);
  }

  removeTask(index: number): void {
    this.tasks.removeAt(index);
  }

  removeFinding(index: number): void {
    this.findings.removeAt(index);
  }

  loadDemoData(): void {
    this.editingId.set('wf-demo');
    this.isEditing.set(true);

    this.form.patchValue({
      name: 'Enterprise Angular workflow',
      repository: 'SkillEvolve/skillevolve-frontend',
      priority: WorkflowPriority.URGENT,
      maturity: 'advanced',
    });

    this.form.controls.repository.setValue('SkillEvolve/skillevolve-frontend');
    this.form.controls.name.updateValueAndValidity();
    this.form.controls.repository.markAsTouched();
  }

  hasError(control: AbstractControl, error: string): boolean {
    return control.hasError(error) && (control.touched || control.dirty);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.form.setErrors({ invalidWizard: true });
      return;
    }

    this.submitted.emit(this.form.getRawValue());
    this.form.reset();
    this.currentStep.set(0);
  }
}
