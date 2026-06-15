import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { AuditChecklistItem, AuditChecklistValue } from '../models/quality-audit.models';

@Component({
  selector: 'app-audit-checklist-control',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-checklist-control.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AuditChecklistControlComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditChecklistControlComponent implements ControlValueAccessor {
  readonly disabledLabel = input('Checklist verrouillée');

  protected value: AuditChecklistValue = {
    items: [],
    completedCount: 0,
    requiredCompletionRate: 0,
  };

  protected disabled = false;

  private onChange: (value: AuditChecklistValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: AuditChecklistValue | null): void {
    this.value = value ?? {
      items: [],
      completedCount: 0,
      requiredCompletionRate: 0,
    };
  }

  registerOnChange(fn: (value: AuditChecklistValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  protected toggleItem(item: AuditChecklistItem): void {
    if (this.disabled) {
      return;
    }

    const items = this.value.items.map((current) =>
      current.id === item.id ? { ...current, checked: !current.checked } : current,
    );
    const completedCount = items.filter((current) => current.checked).length;
    const requiredItems = items.filter((current) => current.required);
    const completedRequired = requiredItems.filter((current) => current.checked).length;
    const requiredCompletionRate = requiredItems.length > 0 ? completedRequired / requiredItems.length : 1;

    this.value = {
      items,
      completedCount,
      requiredCompletionRate,
    };

    this.onChange(this.value);
    this.onTouched();
  }

  protected trackItem(index: number, item: AuditChecklistItem): string {
    return `${index}-${item.id}`;
  }
}
