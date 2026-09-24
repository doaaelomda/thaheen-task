import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Course, LessonStatus } from '../../core/models/course.model';
import { AuthService } from '../../core/services/auth.service';
import { CoursesService } from '../../core/services/courses.service';
import { LanguageService } from '../../core/services/language.service';
import { ProgressService } from '../../core/services/progress.service';
import { CourseCardSkeletonComponent } from '../../shared/components/course-card/course-card-skeleton.component';
import { CourseCardComponent } from '../../shared/components/course-card/course-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { DurationPipe } from '../../shared/pipes/duration.pipe';

export type CourseSortBy = 'name' | 'instructor' | 'progress';
export type CourseStatusFilter = 'all' | LessonStatus;

@Component({
  selector: 'app-courses-page',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    CourseCardComponent,
    CourseCardSkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    DurationPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './courses-page.component.html',
})
export class CoursesPageComponent {
  protected readonly skeletonPlaceholders = [0, 1, 2, 3, 4, 5];

  private readonly coursesService = inject(CoursesService);
  protected readonly progressService = inject(ProgressService);
  protected readonly languageService = inject(LanguageService);
  protected readonly authService = inject(AuthService);

  protected readonly loading = this.coursesService.loading;
  protected readonly error = this.coursesService.error;
  protected readonly courses = this.coursesService.courses;

  protected readonly searchQuery = signal('');
  protected readonly instructorFilter = signal('');
  protected readonly statusFilter = signal<CourseStatusFilter>('all');
  protected readonly sortBy = signal<CourseSortBy>('name');

  protected readonly instructors = computed(() => {
    const names = this.courses().map((course) => this.languageService.pick(course.instructor));
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  });

  protected readonly continueWatching = computed(() =>
    this.authService.isLoggedIn() ? this.progressService.continueWatching(this.courses()) : undefined,
  );

  protected readonly filteredCourses = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const instructor = this.instructorFilter();
    const loggedIn = this.authService.isLoggedIn();
    const status = loggedIn ? this.statusFilter() : 'all';
    const sortBy = loggedIn ? this.sortBy() : this.sortBy() === 'progress' ? 'name' : this.sortBy();

    let list = this.courses();

    if (query) {
      list = list.filter((course) => this.languageService.pick(course.title).toLowerCase().includes(query));
    }
    if (instructor) {
      list = list.filter((course) => this.languageService.pick(course.instructor) === instructor);
    }
    if (status !== 'all') {
      list = list.filter((course) => this.courseStatus(course) === status);
    }

    const lang = this.languageService.language();
    return [...list].sort((a, b) => {
      if (sortBy === 'instructor') {
        return this.languageService.pick(a.instructor).localeCompare(this.languageService.pick(b.instructor), lang);
      }
      if (sortBy === 'progress') {
        return this.progressService.courseProgressPercent(b) - this.progressService.courseProgressPercent(a);
      }
      return this.languageService.pick(a.title).localeCompare(this.languageService.pick(b.title), lang);
    });
  });

  constructor() {
    void this.coursesService.ensureLoaded();
  }

  courseStatus(course: Course): LessonStatus {
    const percent = this.progressService.courseProgressPercent(course);
    if (percent >= 100) return 'completed';
    if (percent > 0) return 'in-progress';
    return 'not-started';
  }

  progressFor(courseId: string): number {
    const course = this.courses().find((c) => c.id === courseId);
    return course ? this.progressService.courseProgressPercent(course) : 0;
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onInstructorChange(event: Event): void {
    this.instructorFilter.set((event.target as HTMLSelectElement).value);
  }

  onStatusChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as CourseStatusFilter);
  }

  onSortChange(event: Event): void {
    this.sortBy.set((event.target as HTMLSelectElement).value as CourseSortBy);
  }
}
