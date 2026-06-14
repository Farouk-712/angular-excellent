import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function dateAfterTodayValidator(): ValidatorFn {
  return (control: AbstractControl<string | null>): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(control.value);
    selectedDate.setHours(0, 0, 0, 0);

    return selectedDate >= today ? null : { pastDate: true };
  };
}

export function uniqueArrayItemsValidator(): ValidatorFn {
  return (control: AbstractControl<readonly string[] | null>): ValidationErrors | null => {
    const values = control.value ?? [];
    const normalizedValues = values.map((value) => value.trim().toLowerCase()).filter(Boolean);
    const uniqueValues = new Set(normalizedValues);

    return uniqueValues.size === normalizedValues.length ? null : { duplicatedItems: true };
  };
}

export function budgetRangeValidator(minimum: number, maximum: number): ValidatorFn {
  return (control: AbstractControl<number | null>): ValidationErrors | null => {
    const value = Number(control.value ?? 0);

    if (Number.isNaN(value)) {
      return { invalidBudget: true };
    }

    if (value < minimum) {
      return { budgetTooLow: { minimum, actual: value } };
    }

    if (value > maximum) {
      return { budgetTooHigh: { maximum, actual: value } };
    }

    return null;
  };
}
