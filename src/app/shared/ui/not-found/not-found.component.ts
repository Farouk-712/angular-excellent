import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="card not-found">
      <p class="eyebrow">404</p>
      <h1>Page not found</h1>
      <p>The requested page does not exist or has been moved.</p>
      <a class="btn btn-primary" routerLink="/projects">Back to projects</a>
    </section>
  `,
  styles: [`
    .not-found { display: grid; justify-items: start; gap: 12px; padding: 32px; }
    .eyebrow { margin: 0; color: var(--primary); font-weight: 900; }
    h1, p { margin: 0; }
    p { color: var(--muted); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
