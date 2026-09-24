import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';
import { AuthService } from '../../core/services/auth.service';
import { CoursesService } from '../../core/services/courses.service';
import { ProgressService } from '../../core/services/progress.service';
import { countLessons } from '../../core/utils/lesson-order';
import { CourseCardComponent } from '../../shared/components/course-card/course-card.component';

const FEATURED_COUNT = 3;

interface HomeFeature {
  readonly icon: string;
  readonly titleKey: string;
  readonly descKey: string;
}

const FEATURES: readonly HomeFeature[] = [
  { icon: '🎬', titleKey: 'home.featureVideoTitle', descKey: 'home.featureVideoDesc' },
  { icon: '📈', titleKey: 'home.featureProgressTitle', descKey: 'home.featureProgressDesc' },
  { icon: '🔒', titleKey: 'home.featureSequentialTitle', descKey: 'home.featureSequentialDesc' },
  { icon: '🌐', titleKey: 'home.featureBilingualTitle', descKey: 'home.featureBilingualDesc' },
];

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe, CourseCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-page.component.html',
})
export class HomePageComponent {
  protected readonly features = FEATURES;

  private readonly coursesService = inject(CoursesService);
  protected readonly progressService = inject(ProgressService);
  protected readonly languageService = inject(LanguageService);
  protected readonly authService = inject(AuthService);

  protected readonly courses = this.coursesService.courses;

  protected readonly featuredCourses = computed(() => this.courses().slice(0, FEATURED_COUNT));

  protected readonly totalLessons = computed(() =>
    this.courses().reduce((sum, course) => sum + countLessons(course), 0),
  );

  protected readonly continueWatching = computed(() =>
    this.authService.isLoggedIn() ? this.progressService.continueWatching(this.courses()) : undefined,
  );

  constructor() {
    void this.coursesService.ensureLoaded();
  }

  progressFor(courseId: string): number {
    const course = this.courses().find((c) => c.id === courseId);
    return course ? this.progressService.courseProgressPercent(course) : 0;
  }
}
