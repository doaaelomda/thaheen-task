import { TestBed } from '@angular/core/testing';
import { Injectable, inject, provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, convertToParamMap, provideRouter } from '@angular/router';
import { TranslateNoOpLoader, provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { Course } from '../models/course.model';
import { ProgressState } from '../models/progress.model';
import { AuthService } from '../services/auth.service';
import { CoursesService } from '../services/courses.service';
import { ProgressStorage } from '../services/progress-storage';
import { ProgressService } from '../services/progress.service';
import { ToastService } from '../services/toast.service';
import { lessonUnlockGuard } from './lesson-unlock.guard';

@Injectable()
class FakeProgressStorage extends ProgressStorage {
  private state: ProgressState = { courses: {} };
  read(): ProgressState {
    return this.state;
  }
  write(state: ProgressState): void {
    this.state = state;
  }
}

@Injectable()
class FakeAuthService {
  private loggedIn = false;
  isLoggedIn(): boolean {
    return this.loggedIn;
  }
  setLoggedIn(value: boolean): void {
    this.loggedIn = value;
  }
}

const COURSE: Course = {
  id: 'course-1',
  title: { ar: 'Anatomy', en: 'Anatomy' },
  instructor: { ar: 'Dr. A', en: 'Dr. A' },
  thumbnail: 'assets/images/x.svg',
  sections: [
    {
      id: 's1',
      title: { ar: 'Section 1', en: 'Section 1' },
      lessons: [
        { id: 'l1', title: { ar: 'Lesson 1', en: 'Lesson 1' }, durationSec: 100, video: 'assets/videos/lesson1.mp4' },
        { id: 'l2', title: { ar: 'Lesson 2', en: 'Lesson 2' }, durationSec: 100, video: 'assets/videos/lesson2.mp4' },
      ],
    },
  ],
};

class FakeCoursesService {
  async ensureLoaded(): Promise<void> {}
  courseById(id: string): Course | undefined {
    return id === COURSE.id ? COURSE : undefined;
  }
  isFreePreviewLesson(courseId: string, lessonId: string): boolean {
    return courseId === COURSE.id && lessonId === 'l1';
  }
}

function makeRoute(courseId: string, lessonId: string): ActivatedRouteSnapshot {
  return { paramMap: convertToParamMap({ courseId, lessonId }) } as ActivatedRouteSnapshot;
}

describe('lessonUnlockGuard', () => {
  let fakeAuth: FakeAuthService;

  beforeEach(() => {
    fakeAuth = new FakeAuthService();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideTranslateService({ loader: provideTranslateLoader(TranslateNoOpLoader) }),
        { provide: CoursesService, useClass: FakeCoursesService },
        { provide: ProgressStorage, useClass: FakeProgressStorage },
        { provide: AuthService, useValue: fakeAuth },
      ],
    });
  });

  it('allows a signed-out visitor to watch the free-preview (first) lesson', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lessonUnlockGuard(makeRoute(COURSE.id, 'l1'), {} as RouterStateSnapshot),
    );
    expect(result).toBeTrue();
  });

  it('bounces a signed-out visitor away from any other lesson and shows a toast', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lessonUnlockGuard(makeRoute(COURSE.id, 'l2'), {} as RouterStateSnapshot),
    );
    expect(result instanceof UrlTree).toBeTrue();
    expect((result as UrlTree).toString()).toContain('/login');

    const toastService = TestBed.inject(ToastService);
    expect(toastService.message()).not.toBeNull();
  });

  it('bounces a signed-in but unenrolled user back to the course page with a toast', async () => {
    fakeAuth.setLoggedIn(true);
    const result = await TestBed.runInInjectionContext(() =>
      lessonUnlockGuard(makeRoute(COURSE.id, 'l2'), {} as RouterStateSnapshot),
    );
    expect(result instanceof UrlTree).toBeTrue();
    expect((result as UrlTree).toString()).toContain('/courses/course-1');
    expect((result as UrlTree).toString()).not.toContain('locked=l2');

    const toastService = TestBed.inject(ToastService);
    expect(toastService.message()).not.toBeNull();
  });

  it('redirects an enrolled, signed-in user to the course page when the lesson is still locked by progress', async () => {
    fakeAuth.setLoggedIn(true);
    const progressService = TestBed.runInInjectionContext(() => inject(ProgressService));
    progressService.enroll(COURSE.id);

    const result = await TestBed.runInInjectionContext(() =>
      lessonUnlockGuard(makeRoute(COURSE.id, 'l2'), {} as RouterStateSnapshot),
    );
    expect(result instanceof UrlTree).toBeTrue();
    expect((result as UrlTree).toString()).toContain('/courses/course-1');
    expect((result as UrlTree).toString()).toContain('locked=l2');
  });

  it('lets a non-existent lesson id through so the page can show a not-found state', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lessonUnlockGuard(makeRoute(COURSE.id, 'does-not-exist'), {} as RouterStateSnapshot),
    );
    expect(result).toBeTrue();
  });
});
