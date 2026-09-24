export interface StudentAccount {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly password: string;
}

export interface AuthState {
  readonly accounts: readonly StudentAccount[];
  readonly currentUserId: string | null;
}

export interface StudentProfile {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}
