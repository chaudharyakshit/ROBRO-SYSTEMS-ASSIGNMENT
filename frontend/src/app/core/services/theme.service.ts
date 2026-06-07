import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeType = 'white' | 'aurora' | 'carbon';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private activeThemeSubject = new BehaviorSubject<ThemeType>(this.getInitialTheme());
  public activeTheme$ = this.activeThemeSubject.asObservable();

  public isSidebarCollapsed = false;

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  constructor() {
    // Apply initial theme to document body on application bootstrap
    this.applyThemeToBody(this.theme);
  }

  get theme(): ThemeType {
    return this.activeThemeSubject.value;
  }

  setTheme(theme: ThemeType): void {
    localStorage.setItem('robro_theme', theme);
    this.activeThemeSubject.next(theme);
    this.applyThemeToBody(theme);
  }

  private getInitialTheme(): ThemeType {
    try {
      const stored = localStorage.getItem('robro_theme') as ThemeType;
      return ['white', 'aurora', 'carbon'].includes(stored) ? stored : 'white';
    } catch {
      return 'white';
    }
  }

  private applyThemeToBody(theme: ThemeType): void {
    try {
      const body = document.body;
      body.classList.remove('theme-white', 'theme-aurora', 'theme-carbon');
      body.classList.add(`theme-${theme}`);
    } catch (err) {
      console.error('[Theme] Body class update failed', err);
    }
  }
}
