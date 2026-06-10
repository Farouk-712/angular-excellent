import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  readonly title: string;
  readonly message: string;
  readonly type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastSubject = new BehaviorSubject<ToastMessage | null>(null);

  readonly toast$: Observable<ToastMessage | null> = this.toastSubject.asObservable();

  show(toast: ToastMessage, durationMs = 3500): void {
    this.toastSubject.next(toast);
    timer(durationMs).subscribe(() => this.toastSubject.next(null));
  }

  success(title: string, message: string): void {
    this.show({ title, message, type: 'success' });
  }

  error(title: string, message: string): void {
    this.show({ title, message, type: 'error' }, 4800);
  }
}
