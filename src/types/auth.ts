/**
 * Core authentication types for the Nebbler app.
 *
 * The IAuthService interface is the main plugin point for swapping
 * the mock auth service with a real backend implementation.
 */

export interface User {
  id: string;
  email: string;
  username?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt?: string;
}

/**
 * Plugin point: Auth service interface.
 *
 * To connect a real backend, create a class implementing this interface
 * and replace the export in `src/services/authService.ts`.
 *
 * Example:
 * ```ts
 * class RealAuthService implements IAuthService {
 *   async login(credentials: LoginCredentials): Promise<AuthResponse> {
 *     const res = await fetch(`${API_URL}/auth/login`, {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify(credentials),
 *     });
 *     if (!res.ok) throw new Error((await res.json()).error);
 *     return AuthResponseSchema.parse(await res.json());
 *   }
 *   // ... other methods
 * }
 * ```
 */
export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  register(credentials: RegisterCredentials): Promise<AuthResponse>;
  logout(): Promise<void>;
  refreshToken(token: string): Promise<AuthResponse>;
  getCurrentUser(token: string): Promise<User>;
}
