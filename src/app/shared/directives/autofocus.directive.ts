import { AfterViewInit, Directive, ElementRef, inject, Input } from '@angular/core';

@Directive({
  selector: '[appAutofocus]',
  standalone: true,
})
export class AutofocusDirective implements AfterViewInit {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  @Input() appAutofocus = true;

  ngAfterViewInit(): void {
    if (!this.appAutofocus) {
      return;
    }

    queueMicrotask(() => this.elementRef.nativeElement.focus());
  }
}
