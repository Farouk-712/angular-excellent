import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuditCriterionScore, AuditSeverity } from '../models/quality-audit.models';

@Component({
  selector: 'app-audit-score-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-score-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditScoreCardComponent {
  @Input({ required: true }) criterion!: AuditCriterionScore;

  protected readonly severityLabels: Record<AuditSeverity, string> = {
    [AuditSeverity.Low]: 'Excellent',
    [AuditSeverity.Medium]: 'Correct',
    [AuditSeverity.High]: 'À renforcer',
    [AuditSeverity.Critical]: 'Prioritaire',
  };

  protected get percentage(): number {
    return Math.round(this.criterion.score * 100);
  }

  protected get severityClass(): string {
    switch (this.criterion.severity) {
      case AuditSeverity.Low:
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case AuditSeverity.Medium:
        return 'border-sky-200 bg-sky-50 text-sky-700';
      case AuditSeverity.High:
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case AuditSeverity.Critical:
        return 'border-rose-200 bg-rose-50 text-rose-700';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-600';
    }
  }

  protected trackSignal(index: number, signal: string): string {
    return `${index}-${signal}`;
  }
}
