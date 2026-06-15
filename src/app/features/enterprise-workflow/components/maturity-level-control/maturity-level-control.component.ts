import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';

type MaturityLevel = 'low' | 'intermediate' | 'good' | 'advanced';

@Component({
  selector: 'app-maturity-level-control',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule],
  templateUrl: './maturity-level-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MaturityLevelControlComponent),
      multi: true,
    },
  ],
})
export class MaturityLevelControlComponent implements ControlValueAccessor {
  readonly levels: ReadonlyArray<MaturityLevel> = ['low', 'intermediate', 'good', 'advanced'];
  readonly value = signal<MaturityLevel>('intermediate');
  readonly disabled = signal(false);

  private onChange: (value: MaturityLevel) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: MaturityLevel | null): void {
    this.value.set(value ?? 'intermediate');
  }

  registerOnChange(callback: (value: MaturityLevel) => void): void {
    this.onChange = callback;
  }

  registerOnTouched(callback: () => void): void {
    this.onTouched = callback;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  select(level: MaturityLevel): void {
    if (this.disabled()) {
      return;
    }

    this.value.set(level);
    this.onChange(level);
    this.onTouched();
  }
}
