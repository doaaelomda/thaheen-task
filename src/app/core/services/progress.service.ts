import { Injectable, computed, inject, signal } from '@angular/core';
import { Course, LessonStatus, LocalizedText } from '../models/course.model';
import {
  COMPLETION_THRESHOLD,
  ContinueWatching,
  CourseProgress,
  LessonProgress,
  ProgressState,
} from '../models/progress.model';
import { countLessons, getOrderedLessons } from '../utils/lesson-order';
import { ProgressStorage } from './progress-storage';

const DEFAULT_PLAYBACK_RATE = 1;

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly storage = inject(ProgressStorage);

  private readonly state = signal<ProgressState>(this.storage.read());

  readonly playbackRate = computed(() => this.state().lastPlaybackRate ?? DEFAULT_PLAYBACK_RATE);

  private persist(next: ProgressState): void {
    this.state.set(next);
    this.storage.write(next);
  }

  private getCourseProgress(courseId: string): CourseProgress | undefined {
    return this.state().courses[courseId];
  }

  getLessonProgress(courseId: string, lessonId: string): LessonProgress | undefined {
    return this.getCourseProgress(courseId)?.lessons[lessonId];
  }

  lessonStatus(courseId: string, lessonId: string): LessonStatus {
    const progress = this.getLessonProgress(courseId, lessonId);
    if (!progress) return 'not-started';
    if (progress.completed) return 'completed';
    return progress.positionSec > 0 ? 'in-progress' : 'not-started';
  }

  isLessonUnlocked(course: Course, lessonId: string): boolean {
    const ordered = getOrderedLessons(course);
    const index = ordered.findIndex((lesson) => lesson.id === lessonId);
    if (index <= 0) {
      return index === 0;
    }
    const previous = ordered[index - 1];
    return this.lessonStatus(course.id, previous.id) === 'completed';
  }

  courseProgressPercent(course: Course): number {
    const total = countLessons(course);
    if (total === 0) return 0;
    const completed = getOrderedLessons(course).filter(
      (lesson) => this.lessonStatus(course.id, lesson.id) === 'completed',
    ).length;
    return Math.round((completed / total) * 100);
  }

  updatePosition(courseId: string, lessonId: string, positionSec: number, durationSec: number): void {
    const existing = this.getLessonProgress(courseId, lessonId);
    const watchedRatio = durationSec > 0 ? positionSec / durationSec : 0;
    const completed = existing?.completed || watchedRatio >= COMPLETION_THRESHOLD;

    const lessonProgress: LessonProgress = {
      lessonId,
      positionSec: Math.max(0, Math.floor(positionSec)),
      completed,
      lastUpdated: new Date().toISOString(),
    };

    const currentCourse = this.getCourseProgress(courseId);
    const nextCourse: CourseProgress = {
      courseId,
      lessons: { ...currentCourse?.lessons, [lessonId]: lessonProgress },
    };

    this.persist({
      ...this.state(),
      courses: { ...this.state().courses, [courseId]: nextCourse },
    });
  }

  setPlaybackRate(rate: number): void {
    this.persist({ ...this.state(), lastPlaybackRate: rate });
  }

  isEnrolled(courseId: string): boolean {
    return this.state().enrolledCourseIds?.includes(courseId) ?? false;
  }

  enroll(courseId: string): void {
    if (this.isEnrolled(courseId)) return;
    const enrolledCourseIds = [...(this.state().enrolledCourseIds ?? []), courseId];
    this.persist({ ...this.state(), enrolledCourseIds });
  }

  private noteKey(courseId: string, lessonId: string): string {
    return `${courseId}::${lessonId}`;
  }

  getNote(courseId: string, lessonId: string): string {
    return this.state().notes?.[this.noteKey(courseId, lessonId)] ?? '';
  }

  setNote(courseId: string, lessonId: string, text: string): void {
    const key = this.noteKey(courseId, lessonId);
    const notes = { ...this.state().notes };
    if (text.trim()) {
      notes[key] = text;
    } else {
      delete notes[key];
    }
    this.persist({ ...this.state(), notes });
  }

  continueWatching(courses: readonly Course[]): ContinueWatching | undefined {
    let best: { course: Course; lesson: LessonProgress; title: LocalizedText; durationSec: number } | undefined;

    for (const course of courses) {
      if (!this.isEnrolled(course.id)) continue;
      for (const lesson of getOrderedLessons(course)) {
        const progress = this.getLessonProgress(course.id, lesson.id);
        if (!progress || progress.completed || progress.positionSec <= 0) continue;
        if (!best || progress.lastUpdated > best.lesson.lastUpdated) {
          best = { course, lesson: progress, title: lesson.title, durationSec: lesson.durationSec };
        }
      }
    }

    if (!best) return undefined;
    return {
      courseId: best.course.id,
      courseTitle: best.course.title,
      lessonId: best.lesson.lessonId,
      lessonTitle: best.title,
      positionSec: best.lesson.positionSec,
      durationSec: best.durationSec,
    };
  }
}
