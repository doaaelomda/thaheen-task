import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center gap-3 py-16 text-slate-500 dark:text-slate-400" role="status">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 dark:border-primary-800 border-t-primary-600"></div>
      <p>{{ 'common.loading' | translate }}</p>
    </div>
  `,
})
export class LoadingSpinnerComponent {}
