import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private key = 'theme';
  private current: Theme = 'light';

  constructor(@Inject(DOCUMENT) private doc: Document) {
    const saved = (localStorage.getItem(this.key) as Theme | null);
    if (saved === 'light' || saved === 'dark') {
      this.apply(saved);
      return;
    }
    // First-time: honor OS preference
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
    this.apply(prefersDark ? 'dark' : 'light');
  }

  get theme(): Theme {
    return this.current;
  }

  toggle(): void {
    this.apply(this.current === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    this.apply(theme);
  }

  private apply(theme: Theme) {
    this.current = theme;
    localStorage.setItem(this.key, theme);
    // Put the flag on the <html> element
    this.doc.documentElement.setAttribute('data-theme', theme);
  }
}
