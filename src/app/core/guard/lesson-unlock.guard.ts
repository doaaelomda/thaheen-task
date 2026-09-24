import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { CoursesService } from '../services/courses.service';
import { ProgressService } from '../services/progress.service';
import { ToastService } from '../services/toast.service';

export const lessonUnlockGuard: CanActivateFn = async (route) => {
  const coursesService = inject(CoursesService);
  const progressService = inject(ProgressService);
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const translate = inject(TranslateService);
  const router = inject(Router);

  const courseId = route.paramMap.get('courseId') ?? '';
  const lessonId = route.paramMap.get('lessonId') ?? '';

  await coursesService.ensureLoaded();
  const course = coursesService.courseById(courseId);
  if (!course) {
    return true;
  }

  const lessonExists = course.sections.some((section) =>
    section.lessons.some((lesson) => lesson.id === lessonId),
  );
  if (!lessonExists) {
    return true;
  }

  const isFreePreview = coursesService.isFreePreviewLesson(courseId, lessonId);

  if (!authService.isLoggedIn() && !isFreePreview) {
    toastService.show(translate.instant('auth.mustLoginToWatch'));
    return router.createUrlTree(['/login']);
  }

  if (authService.isLoggedIn() && !progressService.isEnrolled(courseId) && !isFreePreview) {
    toastService.show(translate.instant('auth.mustEnrollToWatch'));
    return router.createUrlTree(['/courses', courseId]);
  }

  if (progressService.isLessonUnlocked(course, lessonId)) {
    return true;
  }

  return router.createUrlTree(['/courses', courseId], { queryParams: { locked: lessonId } });
};
