import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthState, StudentProfile } from '../models/auth.model';
import { AuthStorage } from './auth-storage';

export type AuthResult = { success: true } | { success: false; error: 'email-taken' | 'invalid-credentials' };

function toProfile(state: AuthState): StudentProfile | null {
  const account = state.accounts.find((a) => a.id === state.currentUserId);
  if (!account) return null;
  return { id: account.id, name: account.name, email: account.email };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storage = inject(AuthStorage);

  private readonly state = signal<AuthState>(this.storage.read());

  readonly currentUser = computed(() => toProfile(this.state()));
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  private persist(next: AuthState): void {
    this.state.set(next);
    this.storage.write(next);
  }

  signUp(name: string, email: string, password: string): AuthResult {
    const normalizedEmail = email.trim().toLowerCase();
    const exists = this.state().accounts.some((a) => a.email === normalizedEmail);
    if (exists) {
      return { success: false, error: 'email-taken' };
    }

    const account = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      password,
    };

    this.persist({
      accounts: [...this.state().accounts, account],
      currentUserId: account.id,
    });
    return { success: true };
  }

  login(email: string, password: string): AuthResult {
    const normalizedEmail = email.trim().toLowerCase();
    const account = this.state().accounts.find(
      (a) => a.email === normalizedEmail && a.password === password,
    );
    if (!account) {
      return { success: false, error: 'invalid-credentials' };
    }

    this.persist({ ...this.state(), currentUserId: account.id });
    return { success: true };
  }

  logout(): void {
    this.persist({ ...this.state(), currentUserId: null });
  }
}
