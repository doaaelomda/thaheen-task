import { TestBed } from '@angular/core/testing';
import { Injectable, provideZonelessChangeDetection } from '@angular/core';
import { Course } from '../models/course.model';
import { ProgressState } from '../models/progress.model';
import { ProgressStorage } from './progress-storage';
import { ProgressService } from './progress.service';

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

function text(value: string): { ar: string; en: string } {
  return { ar: value, en: value };
}

function makeCourse(): Course {
  return {
    id: 'course-1',
    title: text('Anatomy'),
    instructor: text('Dr. A'),
    thumbnail: 'assets/images/x.svg',
    sections: [
      {
        id: 's1',
        title: text('Section 1'),
        lessons: [
          { id: 'l1', title: text('Lesson 1'), durationSec: 100, video: 'assets/videos/lesson1.mp4' },
          { id: 'l2', title: text('Lesson 2'), durationSec: 100, video: 'assets/videos/lesson2.mp4' },
        ],
      },
      {
        id: 's2',
        title: text('Section 2'),
        lessons: [{ id: 'l3', title: text('Lesson 3'), durationSec: 100, video: 'assets/videos/lesson3.mp4' }],
      },
    ],
  };
}

describe('ProgressService', () => {
  let service: ProgressService;
  let course: Course;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ProgressStorage, useClass: FakeProgressStorage },
      ],
    });
    service = TestBed.inject(ProgressService);
    course = makeCourse();
  });

  describe('90% completion rule', () => {
    it('does not mark a lesson completed below 90% watched', () => {
      service.updatePosition(course.id, 'l1', 89, 100);
      expect(service.lessonStatus(course.id, 'l1')).toBe('in-progress');
    });

    it('marks a lesson completed once 90% or more has been watched', () => {
      service.updatePosition(course.id, 'l1', 90, 100);
      expect(service.lessonStatus(course.id, 'l1')).toBe('completed');
    });

    it('keeps a lesson completed even if the position later drops (sticky completion)', () => {
      service.updatePosition(course.id, 'l1', 95, 100);
      service.updatePosition(course.id, 'l1', 5, 100);
      expect(service.lessonStatus(course.id, 'l1')).toBe('completed');
    });
  });

  describe('sequential unlock rule', () => {
    it('always unlocks the first lesson of a course', () => {
      expect(service.isLessonUnlocked(course, 'l1')).toBeTrue();
    });

    it('locks a lesson until the previous one is completed', () => {
      expect(service.isLessonUnlocked(course, 'l2')).toBeFalse();
      service.updatePosition(course.id, 'l1', 95, 100);
      expect(service.isLessonUnlocked(course, 'l2')).toBeTrue();
    });

    it('locks the lesson across a section boundary until the last lesson of the previous section is completed', () => {
      service.updatePosition(course.id, 'l1', 95, 100);
      expect(service.isLessonUnlocked(course, 'l3')).toBeFalse();
      service.updatePosition(course.id, 'l2', 95, 100);
      expect(service.isLessonUnlocked(course, 'l3')).toBeTrue();
    });
  });

  describe('course progress percentage', () => {
    it('is 0% when nothing is completed', () => {
      expect(service.courseProgressPercent(course)).toBe(0);
    });

    it('reflects the ratio of completed to total lessons, rounded', () => {
      service.updatePosition(course.id, 'l1', 95, 100);
      expect(service.courseProgressPercent(course)).toBe(33);
    });

    it('is 100% once every lesson is completed', () => {
      service.updatePosition(course.id, 'l1', 95, 100);
      service.updatePosition(course.id, 'l2', 95, 100);
      service.updatePosition(course.id, 'l3', 95, 100);
      expect(service.courseProgressPercent(course)).toBe(100);
    });

    it('is 50% when 5 of 10 lessons are completed', () => {
      const tenLessonCourse: Course = {
        ...course,
        sections: [
          {
            id: 's1',
            title: text('Section 1'),
            lessons: Array.from({ length: 10 }, (_, i) => ({
              id: `lesson-${i + 1}`,
              title: text(`Lesson ${i + 1}`),
              durationSec: 100,
              video: `assets/videos/lesson${i + 1}.mp4`,
            })),
          },
        ],
      };

      for (let i = 1; i <= 5; i++) {
        service.updatePosition(tenLessonCourse.id, `lesson-${i}`, 95, 100);
      }

      expect(service.courseProgressPercent(tenLessonCourse)).toBe(50);
    });
  });

  describe('course enrollment', () => {
    it('is not enrolled in a course by default', () => {
      expect(service.isEnrolled(course.id)).toBeFalse();
    });

    it('becomes enrolled after enroll() and stays idempotent on repeat calls', () => {
      service.enroll(course.id);
      service.enroll(course.id);
      expect(service.isEnrolled(course.id)).toBeTrue();
    });

    it('excludes an unenrolled course from continue watching even with progress', () => {
      service.updatePosition(course.id, 'l2', 40, 100);
      expect(service.continueWatching([course])).toBeUndefined();
    });
  });

  describe('lesson notes', () => {
    it('returns an empty string when no note was saved', () => {
      expect(service.getNote(course.id, 'l1')).toBe('');
    });

    it('saves and returns a note scoped to a single lesson', () => {
      service.setNote(course.id, 'l1', 'remember the femur');
      service.setNote(course.id, 'l2', 'joints recap');
      expect(service.getNote(course.id, 'l1')).toBe('remember the femur');
      expect(service.getNote(course.id, 'l2')).toBe('joints recap');
    });

    it('clears a note when saved as blank text', () => {
      service.setNote(course.id, 'l1', 'draft');
      service.setNote(course.id, 'l1', '   ');
      expect(service.getNote(course.id, 'l1')).toBe('');
    });
  });

  describe('continue watching', () => {
    it('returns undefined when nothing has been started', () => {
      expect(service.continueWatching([course])).toBeUndefined();
    });

    it('points at an in-progress lesson, not a completed one', () => {
      service.enroll(course.id);
      service.updatePosition(course.id, 'l1', 95, 100);
      service.updatePosition(course.id, 'l2', 40, 100);
      const result = service.continueWatching([course]);
      expect(result?.lessonId).toBe('l2');
    });
  });
});
