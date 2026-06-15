import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function repositoryNameValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value?.trim() ?? '';

    if (!value) {
      return { repositoryRequired: true };
    }

    if (!/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(value)) {
      return { repositoryFormat: true };
    }

    return null;
  };
}

export function branchNameValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value?.trim() ?? '';

    if (value.length < 2) {
      return { branchTooShort: true };
    }

    if (value.includes(' ')) {
      return { branchContainsSpace: true };
    }

    return null;
  };
}

export function minimumChecklistCompletionValidator(minimumRate: number): ValidatorFn {
  return (control: AbstractControl<number>): ValidationErrors | null => {
    const rate = Number(control.value ?? 0);

    if (rate >= minimumRate) {
      return null;
    }

    return {
      checklistCompletion: {
        requiredRate: minimumRate,
        actualRate: rate,
      },
    };
  };
}
