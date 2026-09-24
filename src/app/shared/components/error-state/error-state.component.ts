import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center gap-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 py-12 text-center text-red-700 dark:text-red-300" role="alert">
      <span class="text-3xl" aria-hidden="true">⚠️</span>
      <p class="text-base font-medium">{{ title() }}</p>
      @if (subtitle()) {
        <p class="text-sm">{{ subtitle() }}</p>
      }
    </div>
  `,
})
export class ErrorStateComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
