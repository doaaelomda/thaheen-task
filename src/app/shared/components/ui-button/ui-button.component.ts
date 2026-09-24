import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type UiButtonVariant = 'primary' | 'outline' | 'ghost' | 'icon';
export type UiButtonType = 'button' | 'submit';

const BASE_CLASSES = 'inline-flex items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-60';

const VARIANT_CLASSES: Record<UiButtonVariant, string> = {
  primary: 'gap-2 rounded-full px-5 py-2.5 text-sm font-bold shadow-sm bg-primary-600 text-white hover:bg-primary-700',
  outline:
    'gap-2 rounded-full px-5 py-2.5 text-sm font-bold shadow-sm border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
  ghost:
    'gap-2 rounded-full px-5 py-2.5 text-sm font-bold shadow-none text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  icon: 'h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/20',
};

@Component({
  selector: 'app-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button [type]="type()" [disabled]="disabled()" [attr.aria-label]="ariaLabel()" [class]="classes()">
      <ng-content />
    </button>
  `,
})
export class UiButtonComponent {
  readonly type = input<UiButtonType>('button');
  readonly variant = input<UiButtonVariant>('primary');
  readonly fullWidth = input(false);
  readonly disabled = input(false);
  readonly ariaLabel = input<string | null>(null);

  protected readonly classes = computed(() => {
    const parts = [BASE_CLASSES, VARIANT_CLASSES[this.variant()]];
    if (this.fullWidth()) {
      parts.push('w-full');
    }
    return parts.join(' ');
  });
}
