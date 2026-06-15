import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';

@Directive({
  selector: '[appEnterpriseFeatureFlag]',
  standalone: true,
})
export class EnterpriseFeatureFlagDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private visible = false;

  @Input({ alias: 'appEnterpriseFeatureFlag' })
  set enabled(value: boolean | string | null | undefined) {
    const shouldShow = value === true || value === 'true';

    if (shouldShow === this.visible) {
      return;
    }

    this.visible = shouldShow;

    if (shouldShow) {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainerRef.clear();
    }
  }
}
