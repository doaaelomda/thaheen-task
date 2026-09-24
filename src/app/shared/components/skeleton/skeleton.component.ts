import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type SkeletonVariant = 'text' | 'rect' | 'circle';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="animate-pulse bg-slate-200 dark:bg-slate-800"
      [class.rounded-full]="variant === 'circle'"
      [class.rounded-md]="variant === 'rect'"
      [class.rounded]="variant === 'text'"
      [style.width]="width"
      [style.height]="height"
      aria-hidden="true"
    ></div>
  `,
})
export class SkeletonComponent {
  @Input() variant: SkeletonVariant = 'text';
  @Input() width = '100%';
  @Input() height = '1rem';
}
