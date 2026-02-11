import { LoginSchema, RegisterSchema, AuthResponseSchema } from '../authSchemas';

describe('LoginSchema', () => {
  it('accepts valid login data', () => {
    const result = LoginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty email', () => {
    const result = LoginSchema.safeParse({ email: '', password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = LoginSchema.safeParse({ email: 'not-an-email', password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = LoginSchema.safeParse({ email: 'user@example.com', password: '' });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = LoginSchema.safeParse({ email: 'user@example.com', password: 'short' });
    expect(result.success).toBe(false);
  });
});

describe('RegisterSchema', () => {
  const validData = {
    firstName: 'Test',
    lastName: 'User',
    email: 'user@example.com',
    password: 'Password1',
    username: 'testuser',
    confirmPassword: 'Password1',
  };

  it('accepts valid registration data', () => {
    const result = RegisterSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = RegisterSchema.safeParse({
      ...validData,
      confirmPassword: 'Different1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without uppercase letter', () => {
    const result = RegisterSchema.safeParse({
      ...validData,
      password: 'password1',
      confirmPassword: 'password1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without lowercase letter', () => {
    const result = RegisterSchema.safeParse({
      ...validData,
      password: 'PASSWORD1',
      confirmPassword: 'PASSWORD1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without number', () => {
    const result = RegisterSchema.safeParse({
      ...validData,
      password: 'Passwordd',
      confirmPassword: 'Passwordd',
    });
    expect(result.success).toBe(false);
  });

  it('rejects username shorter than 3 characters', () => {
    const result = RegisterSchema.safeParse({ ...validData, username: 'ab' });
    expect(result.success).toBe(false);
  });

  it('rejects username longer than 20 characters', () => {
    const result = RegisterSchema.safeParse({
      ...validData,
      username: 'a'.repeat(21),
    });
    expect(result.success).toBe(false);
  });

  it('rejects username with special characters', () => {
    const result = RegisterSchema.safeParse({
      ...validData,
      username: 'user@name',
    });
    expect(result.success).toBe(false);
  });

  it('accepts username with underscores', () => {
    const result = RegisterSchema.safeParse({
      ...validData,
      username: 'test_user_123',
    });
    expect(result.success).toBe(true);
  });
});

describe('AuthResponseSchema', () => {
  it('accepts valid auth response', () => {
    const result = AuthResponseSchema.safeParse({
      user: { id: '123', email: 'user@example.com', username: 'testuser' },
      token: 'jwt-token-here',
      expiresAt: '2025-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts response without optional fields', () => {
    const result = AuthResponseSchema.safeParse({
      user: { id: '123', email: 'user@example.com' },
      token: 'jwt-token-here',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty token', () => {
    const result = AuthResponseSchema.safeParse({
      user: { id: '123', email: 'user@example.com' },
      token: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid user email', () => {
    const result = AuthResponseSchema.safeParse({
      user: { id: '123', email: 'not-an-email' },
      token: 'jwt-token-here',
    });
    expect(result.success).toBe(false);
  });
});
