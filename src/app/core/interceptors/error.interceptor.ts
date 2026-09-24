import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

const MESSAGES: Record<'ar' | 'en', string> = {
  ar: 'حدث خطأ أثناء تحميل البيانات',
  en: 'Something went wrong while loading data',
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const document = inject(DOCUMENT);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const lang = document.documentElement.lang === 'en' ? 'en' : 'ar';
        toastService.show(MESSAGES[lang]);
      }
      return throwError(() => error);
    }),
  );
};
