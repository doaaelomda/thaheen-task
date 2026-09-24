import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LocalizedText } from '../models/course.model';

export type AppLanguage = 'ar' | 'en';

const STORAGE_KEY = 'thaheen.lang';
const DEFAULT_LANGUAGE: AppLanguage = 'ar';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  readonly language = signal<AppLanguage>(this.readStored() ?? DEFAULT_LANGUAGE);

  constructor() {
    this.apply(this.language());
  }

  toggle(): void {
    this.set(this.language() === 'ar' ? 'en' : 'ar');
  }

  set(lang: AppLanguage): void {
    this.language.set(lang);
    this.apply(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }

  isRtl(): boolean {
    return this.language() === 'ar';
  }

  pick(text: LocalizedText): string {
    return text[this.language()];
  }

  private apply(lang: AppLanguage): void {
    this.translate.use(lang);
    const html = this.document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  private readStored(): AppLanguage | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'ar' || stored === 'en' ? stored : null;
    } catch {
      return null;
    }
  }
}
