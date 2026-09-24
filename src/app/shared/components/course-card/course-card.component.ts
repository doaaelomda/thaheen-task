import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Course, LessonStatus } from '../../../core/models/course.model';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { ProgressService } from '../../../core/services/progress.service';
import { countLessons } from '../../../core/utils/lesson-order';

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './course-card.component.html',
})
export class CourseCardComponent {
  protected readonly languageService = inject(LanguageService);
  protected readonly authService = inject(AuthService);
  protected readonly progressService = inject(ProgressService);

  readonly course = input.required<Course>();
  readonly progressPercent = input<number>(0);

  protected readonly lessonCount = () => countLessons(this.course());

  protected readonly showProgress = computed(
    () => this.authService.isLoggedIn() && this.progressService.isEnrolled(this.course().id),
  );

  protected readonly status = computed<LessonStatus>(() => {
    const percent = this.progressPercent();
    if (percent >= 100) return 'completed';
    if (percent > 0) return 'in-progress';
    return 'not-started';
  });
}
