import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <span class="text-4xl" aria-hidden="true">🔍</span>
      <p class="text-lg font-semibold text-slate-800 dark:text-slate-100">{{ message() }}</p>
      <a [routerLink]="backLink()" class="rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
        {{ 'common.backToCourses' | translate }}
      </a>
    </div>
  `,
})
export class NotFoundComponent {
  readonly message = input.required<string>();
  readonly backLink = input<string>('/courses');
}
