import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CoursesService } from '../../core/services/courses.service';
import { LanguageService } from '../../core/services/language.service';
import { ProgressService } from '../../core/services/progress.service';
import { ToastService } from '../../core/services/toast.service';
import { countLessons } from '../../core/utils/lesson-order';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { NotFoundComponent } from '../../shared/components/not-found/not-found.component';
import { DurationPipe } from '../../shared/pipes/duration.pipe';

export type LessonLockReason = 'none' | 'auth' | 'enroll' | 'progress';

@Component({
  selector: 'app-course-details-page',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    NotFoundComponent,
    DurationPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './course-details-page.component.html',
})
export class CourseDetailsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly coursesService = inject(CoursesService);
  protected readonly progressService = inject(ProgressService);
  protected readonly languageService = inject(LanguageService);
  protected readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly translate = inject(TranslateService);

  protected readonly loading = this.coursesService.loading;

  private readonly courseId = toSignal(this.route.paramMap.pipe(map((params) => params.get('courseId') ?? '')), {
    initialValue: '',
  });

  protected readonly lockedMessage = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('locked'))),
    { initialValue: null },
  );

  protected readonly course = computed(() => this.coursesService.courseById(this.courseId()));

  protected readonly totalLessons = computed(() => {
    const course = this.course();
    return course ? countLessons(course) : 0;
  });

  protected readonly isEnrolled = computed(() => this.progressService.isEnrolled(this.courseId()));

  constructor() {
    void this.coursesService.ensureLoaded();
  }

  lockReason(lessonId: string): LessonLockReason {
    const course = this.course();
    if (!course) return 'none';
    if (this.coursesService.isFreePreviewLesson(course.id, lessonId)) return 'none';
    if (!this.authService.isLoggedIn()) return 'auth';
    if (!this.progressService.isEnrolled(course.id)) return 'enroll';
    return this.progressService.isLessonUnlocked(course, lessonId) ? 'none' : 'progress';
  }

  isUnlocked(lessonId: string): boolean {
    return this.lockReason(lessonId) === 'none';
  }

  lessonLink(lessonId: string): (string | undefined)[] {
    const course = this.course();
    return course ? ['/courses', course.id, 'lessons', lessonId] : [];
  }

  onLockedLessonClick(lessonId: string): void {
    const reason = this.lockReason(lessonId);
    if (reason === 'auth') {
      this.toastService.show(this.translate.instant('auth.mustLoginToWatch'));
      void this.router.navigate(['/login']);
    } else if (reason === 'enroll') {
      this.toastService.show(this.translate.instant('auth.mustEnrollToWatch'));
    }
  }

  onEnroll(): void {
    const course = this.course();
    if (!course) return;
    this.progressService.enroll(course.id);
  }
}
