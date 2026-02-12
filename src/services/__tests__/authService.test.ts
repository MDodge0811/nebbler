import { authService } from '../authService';
import { secureStorage } from '@utils/secureStorage';

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  username: 'testuser',
};

function mockFetchResponse(status: number, body: unknown) {
  (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

beforeEach(() => {
  globalThis.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('authService', () => {
  describe('register', () => {
    it('registers a new user and returns auth response', async () => {
      mockFetchResponse(201, {
        user: mockUser,
        access_token: 'jwt-token-123',
        device_id: 'device-1',
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Password1',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.username).toBe('testuser');
      expect(result.user.id).toBe(mockUser.id);
      expect(result.token).toBe('jwt-token-123');
    });

    it('rejects duplicate email registration', async () => {
      mockFetchResponse(422, {
        errors: { email: ['has already been taken'] },
      });

      await expect(
        authService.register({
          email: 'duplicate@example.com',
          password: 'Password1',
          username: 'user1',
          firstName: 'Dup',
          lastName: 'User',
        })
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('logs in with valid credentials', async () => {
      mockFetchResponse(200, {
        user: mockUser,
        access_token: 'jwt-token-456',
        device_id: 'device-2',
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Password1',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBe('jwt-token-456');
    });

    it('rejects invalid password', async () => {
      mockFetchResponse(401, {
        errors: { detail: 'Invalid email or password' },
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('rejects non-existent email', async () => {
      mockFetchResponse(401, {
        errors: { detail: 'Invalid email or password' },
      });

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'Password1',
        })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('logout', () => {
    it('calls logout endpoint with token', async () => {
      jest.spyOn(secureStorage, 'getToken').mockResolvedValueOnce('stored-token');
      mockFetchResponse(200, { status: 'ok' });

      await expect(authService.logout()).resolves.toBeUndefined();
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('skips fetch when no token stored', async () => {
      jest.spyOn(secureStorage, 'getToken').mockResolvedValueOnce(null);

      await expect(authService.logout()).resolves.toBeUndefined();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });
});
