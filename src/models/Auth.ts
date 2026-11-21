export interface AuthState {
  isAdmin: boolean;
  token: string | null;
}

export interface TokenSession {
  createdAt: number;
  expiresAt: number;
}

export interface LoginCredentials {
  password: string;
}
