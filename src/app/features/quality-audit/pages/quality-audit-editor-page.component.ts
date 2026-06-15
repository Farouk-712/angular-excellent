import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, catchError, finalize, firstValueFrom, map, of, shareReplay, switchMap, tap } from 'rxjs';

import { AuditChecklistControlComponent } from '../components/audit-checklist-control.component';
import { QualityAuditApiService } from '../data-access/quality-audit-api.service';
import {
  AuditChecklistValue,
  AuditCriterionKey,
  AuditSession,
  CreateAuditRequest,
} from '../models/quality-audit.models';
import {
  branchNameValidator,
  minimumChecklistCompletionValidator,
  repositoryNameValidator,
} from '../utils/quality-audit.validators';

@Component({
  selector: 'app-quality-audit-editor-page',
  standalone: true,
  imports: [CommonModule, AsyncPipe, ReactiveFormsModule, AuditChecklistControlComponent],
  templateUrl: './quality-audit-editor-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QualityAuditEditorPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(QualityAuditApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly editingId = this.route.snapshot.paramMap.get('sessionId');
  protected readonly isEditing = this.editingId !== null;

  protected readonly form = this.fb.group({
    repositoryName: ['', [Validators.required, Validators.maxLength(80), repositoryNameValidator()]],
    branchName: ['main', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._/-]+$/), branchNameValidator()]],
    minScore: [0.85, [Validators.required, Validators.min(0), Validators.max(1)]],
    reviewers: this.fb.array<FormControl<string>>([
      this.fb.control('tech-lead-001', { validators: [Validators.required] }),
    ]),
    checklistCompletionRate: [1, [minimumChecklistCompletionValidator(0.8)]],
    checklist: this.fb.control<AuditChecklistValue>(this.buildDefaultChecklist()),
  });

  protected readonly reviewers: FormArray<FormControl<string>> = this.form.controls.reviewers;

  protected readonly formStatus = toSignal(
    this.form.statusChanges.pipe(
      map((status) => status),
      takeUntilDestroyed(this.destroyRef),
    ),
    { initialValue: this.form.status },
  );

  protected readonly session$: Observable<AuditSession | null> = of(this.editingId).pipe(
    switchMap((sessionId) => (sessionId ? this.api.getById(sessionId) : of(null))),
    tap((session) => {
      if (session) {
        this.form.patchValue({
          repositoryName: session.repositoryName,
          branchName: session.branchName,
          minScore: session.summary.globalScore,
          checklistCompletionRate: 1,
        });
        this.form.controls.checklist.setValue(this.buildDefaultChecklist());
      }
    }),
    catchError((error: Error) => {
      this.errorMessage.set(error.message);
      return of(null);
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  protected addReviewer(): void {
    this.reviewers.push(this.fb.control('', { validators: [Validators.required, Validators.minLength(3)] }));
    this.reviewers.markAsDirty();
    this.form.updateValueAndValidity();
  }

  protected removeReviewer(index: number): void {
    if (this.reviewers.length <= 1) {
      this.reviewers.at(0).setErrors({ minimumReviewer: true });
      this.reviewers.at(0).markAsTouched();
      return;
    }

    this.reviewers.removeAt(index);
    this.form.updateValueAndValidity();
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request = this.buildRequest();
    this.save(request);
  }

  protected async save(request: CreateAuditRequest): Promise<void> {
    this.saving.set(true);
    this.errorMessage.set(null);

    const action$ = this.isEditing && this.editingId
      ? this.api.update(this.editingId, request)
      : this.api.create(request);

    try {
      const session = await firstValueFrom(
        action$.pipe(
          finalize(() => this.saving.set(false)),
          takeUntilDestroyed(this.destroyRef),
        ),
      );

      await this.router.navigate(['/quality-audit'], { queryParams: { sessionId: session.id } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Sauvegarde impossible.';
      this.errorMessage.set(message);
    }
  }

  protected resetForm(): void {
    this.form.reset({
      repositoryName: '',
      branchName: 'main',
      minScore: 0.85,
      checklistCompletionRate: 1,
      checklist: this.buildDefaultChecklist(),
    });

    while (this.reviewers.length > 1) {
      this.reviewers.removeAt(this.reviewers.length - 1);
    }

    this.reviewers.at(0).setValue('tech-lead-001');
    this.form.updateValueAndValidity();
  }

  protected hasError(controlName: keyof typeof this.form.controls, errorCode: string): boolean {
    const control = this.form.controls[controlName];
    return control.hasError(errorCode) && (control.touched || control.dirty);
  }

  protected trackReviewer(index: number): string {
    return `reviewer-${index}`;
  }

  private buildRequest(): CreateAuditRequest {
    const value = this.form.getRawValue();

    return {
      repositoryId: value.repositoryName.replace('/', '-').toLowerCase(),
      branchName: value.branchName,
      reviewers: value.reviewers.filter((reviewer) => reviewer.trim().length > 0),
      checklist: value.checklist,
    };
  }

  private buildDefaultChecklist(): AuditChecklistValue {
    const items = Object.values(AuditCriterionKey).map((criterion, index) => ({
      id: `check-${criterion}`,
      label: `Valider le critère ${criterion}`,
      criterion,
      checked: index < 10,
      required: index < 8,
    }));

    const completedCount = items.filter((item) => item.checked).length;
    const requiredItems = items.filter((item) => item.required);
    const requiredCompletionRate = requiredItems.length > 0
      ? requiredItems.filter((item) => item.checked).length / requiredItems.length
      : 1;

    return {
      items,
      completedCount,
      requiredCompletionRate,
    };
  }
}
