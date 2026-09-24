import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'app-course-card-skeleton',
  standalone: true,
  imports: [SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <app-skeleton variant="rect" width="100%" height="10rem" />
      <div class="flex flex-1 flex-col gap-3 p-4">
        <app-skeleton variant="text" width="70%" height="1.1rem" />
        <app-skeleton variant="text" width="45%" height="0.875rem" />
        <app-skeleton variant="text" width="35%" height="0.75rem" />
        <div class="mt-auto pt-2">
          <app-skeleton variant="rect" width="100%" height="0.5rem" />
        </div>
      </div>
    </div>
  `,
})
export class CourseCardSkeletonComponent {}
