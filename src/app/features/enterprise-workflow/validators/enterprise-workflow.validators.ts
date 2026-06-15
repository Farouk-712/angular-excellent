import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

export function repositoryNameValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value ?? '';

    if (!value.includes('/')) {
      return { repositoryFormat: 'Repository must follow owner/name format' };
    }

    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)) {
      return { repositoryPattern: true };
    }

    return null;
  };
}

export function uniqueArrayFieldValidator(fieldName: string): ValidatorFn {
  return (control: AbstractControl<ReadonlyArray<Record<string, unknown>>>): ValidationErrors | null => {
    const value = control.value;

    if (!Array.isArray(value)) {
      return null;
    }

    const values = value
      .map((item) => String(item[fieldName] ?? '').trim().toLowerCase())
      .filter(Boolean);

    const hasDuplicates = values.some((item, index) => values.indexOf(item) !== index);
    return hasDuplicates ? { duplicatedField: fieldName } : null;
  };
}

export const workflowNameValidators = [
  Validators.required,
  Validators.minLength(4),
  Validators.maxLength(80),
  Validators.pattern(/^[A-Za-z0-9À-ÿ\s'._-]+$/),
] as const;
