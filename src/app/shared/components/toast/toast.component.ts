import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (toastService.message(); as msg) {
      <div class="fixed inset-x-0 top-4 z-50 flex justify-center px-4" role="status" aria-live="polite">
        <div
          class="flex items-center gap-2 rounded-full bg-slate-900 dark:bg-slate-100 px-4 py-2.5 text-sm font-medium text-white dark:text-slate-900 shadow-lg"
        >
          <span aria-hidden="true">🔒</span>
          {{ msg.text }}
        </div>
      </div>
    }
  `,
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);
}
