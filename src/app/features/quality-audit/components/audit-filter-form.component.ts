import { ChangeDetectionStrategy, Component, EventEmitter, Output, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map, shareReplay } from 'rxjs';

import { AuditSearchQuery, AuditSeverity, AuditStatus } from '../models/quality-audit.models';

@Component({
  selector: 'app-audit-filter-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './audit-filter-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditFilterFormComponent {
  @Output() readonly queryChanged = new EventEmitter<Partial<AuditSearchQuery>>();

  private readonly fb = inject(FormBuilder);

  protected readonly statuses = Object.values(AuditStatus);
  protected readonly severities = Object.values(AuditSeverity);

  protected readonly form = this.fb.nonNullable.group({
    text: ['', [Validators.maxLength(60)]],
    status: [AuditStatus.Completed],
    severity: [''],
    minScore: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  protected readonly formState$ = this.form.valueChanges.pipe(
    debounceTime(250),
    distinctUntilChanged((left, right) => JSON.stringify(left) === JSON.stringify(right)),
    map((value) => ({
      text: value.text ?? '',
      status: value.status || undefined,
      severity: value.severity || undefined,
      minScore: value.minScore !== undefined ? Number(value.minScore) / 100 : undefined,
    } satisfies Partial<AuditSearchQuery>)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private readonly querySignal = toSignal(this.formState$, {
    initialValue: {
      text: '',
      status: AuditStatus.Completed,
      severity: undefined,
      minScore: 0.7,
    } satisfies Partial<AuditSearchQuery>,
  });

  constructor() {
    effect(() => this.queryChanged.emit(this.querySignal()));
  }

  protected resetFilters(): void {
    this.form.reset({
      text: '',
      status: AuditStatus.Completed,
      severity: '',
      minScore: 70,
    });
    this.form.updateValueAndValidity();
  }

  protected hasError(controlName: keyof typeof this.form.controls, errorCode: string): boolean {
    const control = this.form.controls[controlName];
    return control.hasError(errorCode) && (control.dirty || control.touched);
  }
}
