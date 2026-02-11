import type {
  IAuthService,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  User,
} from '@/types/auth';

/**
 * STUB: Mock auth service for UI development.
 *
 * PLUGIN POINT: Replace this implementation with real API calls.
 * The IAuthService interface contract stays the same — only the
 * implementation changes. TanStack Query mutations in useAuthMutations
 * call these methods, so swapping this file is the only change needed.
 *
 * Example real implementation:
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
 * }
 * export const authService: IAuthService = new RealAuthService();
 * ```
 */

const MOCK_DELAY = 1000;

const mockUsers = new Map<string, { password: string; user: User }>();

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateMockToken(userId: string): string {
  return `mock.${userId}.token.${Date.now()}`;
}

function simulateDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
}

class MockAuthService implements IAuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await simulateDelay();

    const stored = mockUsers.get(credentials.email);
    if (!stored || stored.password !== credentials.password) {
      throw new Error('Invalid email or password');
    }

    return {
      user: stored.user,
      token: generateMockToken(stored.user.id),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    await simulateDelay();

    if (mockUsers.has(credentials.email)) {
      throw new Error('Email already registered');
    }

    const user: User = {
      id: generateUUID(),
      email: credentials.email,
      username: credentials.username,
    };

    mockUsers.set(credentials.email, { password: credentials.password, user });

    return {
      user,
      token: generateMockToken(user.id),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async logout(): Promise<void> {
    await simulateDelay();
  }

  async refreshToken(_token: string): Promise<AuthResponse> {
    await simulateDelay();
    throw new Error('Token refresh not implemented in stub');
  }

  async getCurrentUser(token: string): Promise<User> {
    await simulateDelay();
    const userId = token.split('.')[1];
    for (const [, data] of mockUsers) {
      if (data.user.id === userId) return data.user;
    }
    throw new Error('Invalid token');
  }
}

export const authService: IAuthService = new MockAuthService();
