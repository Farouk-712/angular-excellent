import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-workflow-metric-card',
  standalone: true,
  imports: [NgClass],
  templateUrl: './workflow-metric-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowMetricCardComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value: string | number = 0;
  @Input() description = '';
  @Input() trend: 'up' | 'down' | 'flat' = 'flat';

  readonly trendClass: Record<'up' | 'down' | 'flat', string> = {
    up: 'text-emerald-700 bg-emerald-50',
    down: 'text-rose-700 bg-rose-50',
    flat: 'text-slate-700 bg-slate-100',
  };
}
