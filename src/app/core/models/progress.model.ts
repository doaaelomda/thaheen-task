import { LocalizedText } from './course.model';

export interface LessonProgress {
  readonly lessonId: string;
  readonly positionSec: number;
  readonly completed: boolean;
  readonly lastUpdated: string;
}

export interface CourseProgress {
  readonly courseId: string;
  readonly lessons: Readonly<Record<string, LessonProgress>>;
}

export interface ProgressState {
  readonly courses: Readonly<Record<string, CourseProgress>>;
  readonly lastPlaybackRate?: number;
  readonly notes?: Readonly<Record<string, string>>;
  readonly enrolledCourseIds?: readonly string[];
}

export interface ContinueWatching {
  readonly courseId: string;
  readonly courseTitle: LocalizedText;
  readonly lessonId: string;
  readonly lessonTitle: LocalizedText;
  readonly positionSec: number;
  readonly durationSec: number;
}

export const COMPLETION_THRESHOLD = 0.9;
