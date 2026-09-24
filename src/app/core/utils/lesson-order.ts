import { Course, Lesson } from '../models/course.model';

export function getOrderedLessons(course: Course): readonly Lesson[] {
  return course.sections.flatMap((section) => section.lessons);
}

export function countLessons(course: Course): number {
  return getOrderedLessons(course).length;
}
