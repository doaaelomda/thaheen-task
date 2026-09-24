import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

export type UiInputType = 'text' | 'email' | 'password';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-input.component.html',
})
export class UiInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type: UiInputType = 'text';

  protected readonly ngControl = inject(NgControl, { optional: true, self: true });

  protected value = '';
  protected disabled = false;

  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    this.value = (event.target as HTMLInputElement).value;
    this.onChange(this.value);
  }

  protected get control() {
    return this.ngControl?.control ?? null;
  }

  protected get showError(): boolean {
    const control = this.control;
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected get errorKey(): string | null {
    const errors = this.control?.errors;
    if (!errors) return null;
    if (errors['required']) return 'validation.required';
    if (errors['email']) return 'validation.email';
    if (errors['minlength']) return 'validation.minLength';
    return null;
  }

  protected get errorParams(): Record<string, unknown> {
    const minlength = this.control?.errors?.['minlength'];
    return minlength ? { min: minlength.requiredLength } : {};
  }
}
