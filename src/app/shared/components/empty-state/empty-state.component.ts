import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center gap-2 py-16 text-center text-slate-500 dark:text-slate-400">
      <span class="text-3xl" aria-hidden="true">🗂️</span>
      <p class="text-base font-medium">{{ title() }}</p>
      @if (subtitle()) {
        <p class="text-sm">{{ subtitle() }}</p>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
