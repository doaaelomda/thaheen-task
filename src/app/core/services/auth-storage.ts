import { Injectable } from '@angular/core';
import { AuthState } from '../models/auth.model';

const STORAGE_KEY = 'thaheen.auth.v1';

@Injectable()
export abstract class AuthStorage {
  abstract read(): AuthState;
  abstract write(state: AuthState): void;
}

@Injectable()
export class LocalStorageAuthStorage extends AuthStorage {
  private readonly emptyState: AuthState = { accounts: [], currentUserId: null };

  read(): AuthState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return this.emptyState;
      }
      return JSON.parse(raw) as AuthState;
    } catch {
      return this.emptyState;
    }
  }

  write(state: AuthState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }
}
