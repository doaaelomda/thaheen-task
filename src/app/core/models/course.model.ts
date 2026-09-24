export type LessonStatus = 'not-started' | 'in-progress' | 'completed';

export interface LocalizedText {
  readonly ar: string;
  readonly en: string;
}

export interface Lesson {
  readonly id: string;
  readonly title: LocalizedText;
  readonly durationSec: number;
  readonly video: string;
}

export interface Section {
  readonly id: string;
  readonly title: LocalizedText;
  readonly lessons: readonly Lesson[];
}

export interface Course {
  readonly id: string;
  readonly title: LocalizedText;
  readonly instructor: LocalizedText;
  readonly thumbnail: string;
  readonly sections: readonly Section[];
}

export interface CoursesData {
  readonly courses: readonly Course[];
}
