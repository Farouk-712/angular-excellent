import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';

export type MetricTone = 'neutral' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [DecimalPipe, NgClass],
  templateUrl: './metric-card.component.html',
  styleUrl: './metric-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricCardComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value: number | string = 0;
  @Input() suffix = '';
  @Input() description = '';
  @Input() tone: MetricTone = 'neutral';

  get numericValue(): number | null {
    return typeof this.value === 'number' ? this.value : null;
  }
}
