import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateNoOpLoader, provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { App } from './app';
import { AuthStorage, LocalStorageAuthStorage } from './core/services/auth-storage';
import { ProgressStorage, LocalStorageProgressStorage } from './core/services/progress-storage';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService({ loader: provideTranslateLoader(TranslateNoOpLoader) }),
        { provide: ProgressStorage, useClass: LocalStorageProgressStorage },
        { provide: AuthStorage, useClass: LocalStorageAuthStorage },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
