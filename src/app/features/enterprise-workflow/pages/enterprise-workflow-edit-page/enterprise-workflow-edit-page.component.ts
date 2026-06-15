import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { DirtyAwareComponent } from '../../guards/enterprise-workflow.guard';
import { EnterpriseWorkflowApiService } from '../../data-access/enterprise-workflow-api.service';
import { WorkflowFormWizardComponent } from '../../components/workflow-form-wizard/workflow-form-wizard.component';

@Component({
  selector: 'app-enterprise-workflow-edit-page',
  standalone: true,
  imports: [WorkflowFormWizardComponent],
  templateUrl: './enterprise-workflow-edit-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterpriseWorkflowEditPageComponent implements DirtyAwareComponent {
  private readonly api = inject(EnterpriseWorkflowApiService);
  private readonly router = inject(Router);

  readonly dirty = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  hasUnsavedChanges(): boolean {
    return this.dirty();
  }

  save(payload: unknown): void {
    this.saving.set(true);
    this.dirty.set(false);

    this.api.create(payload as never).subscribe({
      next: (workflow) => {
        this.saving.set(false);
        this.router.navigate(['/enterprise-workflow', workflow.id]);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(error instanceof Error ? error.message : 'Unable to save workflow');
      },
    });
  }
}
