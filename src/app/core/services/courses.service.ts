import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Course, CoursesData } from '../models/course.model';
import { getOrderedLessons } from '../utils/lesson-order';

interface CoursesState {
  readonly courses: readonly Course[];
  readonly loading: boolean;
  readonly error: boolean;
}

const INITIAL_STATE: CoursesState = { courses: [], loading: true, error: false };

@Injectable({ providedIn: 'root' })
export class CoursesService {
  private readonly http = inject(HttpClient);

  private readonly state = signal<CoursesState>(INITIAL_STATE);

  readonly courses = computed(() => this.state().courses);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  private loadPromise: Promise<void> | null = null;

  async ensureLoaded(): Promise<void> {
    if (!this.state().loading && !this.state().error) {
      return;
    }
    if (this.loadPromise) {
      return this.loadPromise;
    }
    this.loadPromise = this.load();
    return this.loadPromise;
  }

  private async load(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<CoursesData>('assets/data/courses.json'));
      this.state.set({ courses: data.courses, loading: false, error: false });
    } catch {
      this.state.set({ courses: [], loading: false, error: true });
    } finally {
      this.loadPromise = null;
    }
  }

  courseById(courseId: string): Course | undefined {
    return this.courses().find((course) => course.id === courseId);
  }

  isFreePreviewLesson(courseId: string, lessonId: string): boolean {
    const [firstCourse] = this.courses();
    if (!firstCourse || firstCourse.id !== courseId) {
      return false;
    }
    const [firstLesson] = getOrderedLessons(firstCourse);
    return firstLesson?.id === lessonId;
  }
}
