import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';

export interface CurrentUserViewModel {
  readonly id: string;
  readonly displayName: string;
  readonly role: 'admin' | 'tech_lead' | 'developer';
}

export interface LayoutPreferences {
  readonly compactMode: boolean;
  readonly showCompletedProjects: boolean;
}

@Injectable({ providedIn: 'root' })
export class AppStateService {
  private readonly userSubject = new BehaviorSubject<CurrentUserViewModel>({
    id: 'usr-demo-1',
    displayName: 'Nour Demo',
    role: 'tech_lead',
  });

  private readonly preferencesSubject = new BehaviorSubject<LayoutPreferences>({
    compactMode: false,
    showCompletedProjects: true,
  });

  readonly user$: Observable<CurrentUserViewModel> = this.userSubject.asObservable();
  readonly preferences$: Observable<LayoutPreferences> = this.preferencesSubject.asObservable();

  readonly headerVm$ = combineLatest([this.user$, this.preferences$]).pipe(
    map(([user, preferences]) => ({
      greeting: `Welcome, ${user.displayName}`,
      roleLabel: user.role.replace('_', ' '),
      preferences,
    })),
  );

  updatePreferences(patch: Partial<LayoutPreferences>): void {
    this.preferencesSubject.next({ ...this.preferencesSubject.value, ...patch });
  }
}
