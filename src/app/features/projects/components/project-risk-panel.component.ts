import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

import { ProjectRiskAssessment } from '../domain/project-analytics.model';

@Component({
  selector: 'app-project-risk-panel',
  standalone: true,
  imports: [NgClass],
  templateUrl: './project-risk-panel.component.html',
  styleUrl: './project-risk-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRiskPanelComponent {
  @Input({ required: true }) risk!: ProjectRiskAssessment;

  readonly visibleFactorLimit = 4;

  get activeFactors() {
    return this.risk.factors.filter((factor) => factor.active).slice(0, this.visibleFactorLimit);
  }
}
