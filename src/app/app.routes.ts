import { Routes } from '@angular/router';
import { lessonUnlockGuard } from './core/guard/lesson-unlock.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home-page.component').then((m) => m.HomePageComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/auth-page.component').then((m) => m.AuthPageComponent),
  },
  {
    path: 'courses',
    loadComponent: () =>
      import('./features/courses/courses-page.component').then((m) => m.CoursesPageComponent),
  },
  {
    path: 'courses/:courseId',
    loadComponent: () =>
      import('./features/course-details/course-details-page.component').then(
        (m) => m.CourseDetailsPageComponent,
      ),
  },
  {
    path: 'courses/:courseId/lessons/:lessonId',
    canActivate: [lessonUnlockGuard],
    loadComponent: () =>
      import('./features/lesson-player/lesson-player-page.component').then(
        (m) => m.LessonPlayerPageComponent,
      ),
  },
  { path: '**', redirectTo: 'courses' },
];
