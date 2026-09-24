import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  readonly id: number;
  readonly text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private timeoutId?: ReturnType<typeof setTimeout>;

  readonly message = signal<ToastMessage | null>(null);

  show(text: string, durationMs = 3500): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    const id = ++this.nextId;
    this.message.set({ id, text });
    this.timeoutId = setTimeout(() => {
      if (this.message()?.id === id) {
        this.message.set(null);
      }
    }, durationMs);
  }

  dismiss(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.message.set(null);
  }
}
