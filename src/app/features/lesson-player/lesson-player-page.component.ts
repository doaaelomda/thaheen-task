import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { Lesson } from '../../core/models/course.model';
import { CoursesService } from '../../core/services/courses.service';
import { LanguageService } from '../../core/services/language.service';
import { ProgressService } from '../../core/services/progress.service';
import { getOrderedLessons } from '../../core/utils/lesson-order';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { NotFoundComponent } from '../../shared/components/not-found/not-found.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { DurationPipe } from '../../shared/pipes/duration.pipe';

export const PLAYBACK_RATES = [1, 1.25, 1.5, 2] as const;

@Component({
  selector: 'app-lesson-player-page',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    LoadingSpinnerComponent,
    NotFoundComponent,
    ErrorStateComponent,
    UiButtonComponent,
    DurationPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lesson-player-page.component.html',
})
export class LessonPlayerPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly coursesService = inject(CoursesService);
  protected readonly progressService = inject(ProgressService);
  protected readonly languageService = inject(LanguageService);

  protected readonly rates = PLAYBACK_RATES;
  protected readonly loading = this.coursesService.loading;

  private readonly courseId = toSignal(this.route.paramMap.pipe(map((p) => p.get('courseId') ?? '')), {
    initialValue: '',
  });
  private readonly lessonId = toSignal(this.route.paramMap.pipe(map((p) => p.get('lessonId') ?? '')), {
    initialValue: '',
  });

  protected readonly course = computed(() => this.coursesService.courseById(this.courseId()));

  protected readonly lesson = computed<Lesson | undefined>(() => {
    const course = this.course();
    if (!course) return undefined;
    return getOrderedLessons(course).find((l) => l.id === this.lessonId());
  });

  protected readonly nextLesson = computed<Lesson | undefined>(() => {
    const course = this.course();
    const current = this.lesson();
    if (!course || !current) return undefined;
    const ordered = getOrderedLessons(course);
    const index = ordered.findIndex((l) => l.id === current.id);
    return index >= 0 ? ordered[index + 1] : undefined;
  });

  protected readonly videoEl = viewChild<ElementRef<HTMLVideoElement>>('video');

  protected readonly isPlaying = signal(false);
  protected readonly currentTime = signal(0);
  protected readonly duration = signal(0);
  protected readonly playbackRate = signal(1);
  protected readonly videoError = signal(false);
  protected readonly noteText = signal('');
  private resumed = false;
  private lastSavedSecond = -1;
  private noteSaveTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    void this.coursesService.ensureLoaded();
    this.playbackRate.set(this.progressService.playbackRate());

    effect(() => {
      const courseId = this.courseId();
      const lessonId = this.lessonId();
      this.noteText.set(this.progressService.getNote(courseId, lessonId));
    });
  }

  onLoadedMetadata(): void {
    const video = this.videoEl()?.nativeElement;
    if (!video) return;
    this.duration.set(video.duration || 0);
    this.videoError.set(false);

    if (!this.resumed) {
      const saved = this.progressService.getLessonProgress(this.courseId(), this.lessonId());
      if (saved && saved.positionSec > 0 && saved.positionSec < video.duration - 1) {
        video.currentTime = saved.positionSec;
      }
      video.playbackRate = this.playbackRate();
      this.resumed = true;
    }
  }

  onTimeUpdate(): void {
    const video = this.videoEl()?.nativeElement;
    if (!video) return;
    this.currentTime.set(video.currentTime);
    const second = Math.floor(video.currentTime);
    if (second !== this.lastSavedSecond) {
      this.lastSavedSecond = second;
      this.progressService.updatePosition(this.courseId(), this.lessonId(), video.currentTime, video.duration || this.duration());
    }
  }

  onVideoError(): void {
    this.videoError.set(true);
  }

  onNoteInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.noteText.set(value);
    if (this.noteSaveTimeout) {
      clearTimeout(this.noteSaveTimeout);
    }
    this.noteSaveTimeout = setTimeout(() => {
      this.progressService.setNote(this.courseId(), this.lessonId(), value);
    }, 400);
  }

  togglePlay(): void {
    const video = this.videoEl()?.nativeElement;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  }

  onPlay(): void {
    this.isPlaying.set(true);
  }

  onPause(): void {
    this.isPlaying.set(false);
  }

  seekTo(seconds: number): void {
    const video = this.videoEl()?.nativeElement;
    if (!video) return;
    video.currentTime = Math.min(Math.max(0, seconds), video.duration || seconds);
  }

  onSeekInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.seekTo(value);
    this.currentTime.set(value);
  }

  setRate(rate: number): void {
    const video = this.videoEl()?.nativeElement;
    this.playbackRate.set(rate);
    if (video) {
      video.playbackRate = rate;
    }
    this.progressService.setPlaybackRate(rate);
  }

  toggleFullscreen(): void {
    const video = this.videoEl()?.nativeElement;
    if (!video) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void video.requestFullscreen?.();
    }
  }

  goToNext(): void {
    const course = this.course();
    const next = this.nextLesson();
    if (course && next) {
      void this.router.navigate(['/courses', course.id, 'lessons', next.id]);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.lesson() || this.videoError()) return;
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

    if (event.code === 'Space') {
      event.preventDefault();
      this.togglePlay();
    } else if (event.code === 'ArrowRight') {
      this.seekTo(this.currentTime() + 5);
    } else if (event.code === 'ArrowLeft') {
      this.seekTo(this.currentTime() - 5);
    }
  }
}
