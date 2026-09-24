import { Injectable } from '@angular/core';
import { ProgressState } from '../models/progress.model';

const STORAGE_KEY = 'thaheen.progress.v1';

@Injectable()
export abstract class ProgressStorage {
  abstract read(): ProgressState;
  abstract write(state: ProgressState): void;
}

@Injectable()
export class LocalStorageProgressStorage extends ProgressStorage {
  private readonly emptyState: ProgressState = { courses: {} };

  read(): ProgressState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return this.emptyState;
      }
      return JSON.parse(raw) as ProgressState;
    } catch {
      return this.emptyState;
    }
  }

  write(state: ProgressState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }
}
