export type UserRole = 'guest' | 'user' | 'member' | 'moderator' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  wallet?: string;
  balance: number;
  premiumUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
  token: string;
  expiresAt: Date;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
}
