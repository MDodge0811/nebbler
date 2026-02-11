import { authService } from '../authService';

describe('authService (mock)', () => {
  describe('register', () => {
    it('registers a new user and returns auth response', async () => {
      const result = await authService.register({
        email: 'new@example.com',
        password: 'Password1',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
      });

      expect(result.user.email).toBe('new@example.com');
      expect(result.user.username).toBe('newuser');
      expect(result.user.id).toBeTruthy();
      expect(result.token).toBeTruthy();
      expect(result.expiresAt).toBeTruthy();
    });

    it('rejects duplicate email registration', async () => {
      await authService.register({
        email: 'duplicate@example.com',
        password: 'Password1',
        username: 'user1',
        firstName: 'Dup',
        lastName: 'User',
      });

      await expect(
        authService.register({
          email: 'duplicate@example.com',
          password: 'Password1',
          username: 'user2',
          firstName: 'Dup',
          lastName: 'Two',
        })
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('logs in with valid credentials after registration', async () => {
      await authService.register({
        email: 'login-test@example.com',
        password: 'Password1',
        username: 'loginuser',
        firstName: 'Login',
        lastName: 'Test',
      });

      const result = await authService.login({
        email: 'login-test@example.com',
        password: 'Password1',
      });

      expect(result.user.email).toBe('login-test@example.com');
      expect(result.token).toBeTruthy();
    });

    it('rejects invalid password', async () => {
      await authService.register({
        email: 'wrongpw@example.com',
        password: 'Password1',
        username: 'wrongpw',
        firstName: 'Wrong',
        lastName: 'Pw',
      });

      await expect(
        authService.login({
          email: 'wrongpw@example.com',
          password: 'WrongPassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('rejects non-existent email', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'Password1',
        })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('logout', () => {
    it('completes without error', async () => {
      await expect(authService.logout()).resolves.toBeUndefined();
    });
  });
});
