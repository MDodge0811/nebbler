import { ApiErrorResponseSchema, FetchCredentialsResponseSchema } from '../apiSchemas';

describe('FetchCredentialsResponseSchema', () => {
  it('accepts a token without expiresAt', () => {
    const result = FetchCredentialsResponseSchema.safeParse({ token: 'abc123' });
    expect(result.success).toBe(true);
  });

  it('accepts a token with expiresAt', () => {
    const result = FetchCredentialsResponseSchema.safeParse({
      token: 'abc123',
      expiresAt: '2026-12-31T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty token', () => {
    const result = FetchCredentialsResponseSchema.safeParse({ token: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing token', () => {
    const result = FetchCredentialsResponseSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('ApiErrorResponseSchema', () => {
  it('accepts an error without message', () => {
    const result = ApiErrorResponseSchema.safeParse({ error: 'not_found' });
    expect(result.success).toBe(true);
  });

  it('accepts an error with message', () => {
    const result = ApiErrorResponseSchema.safeParse({
      error: 'validation_failed',
      message: 'Name is required',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing error field', () => {
    const result = ApiErrorResponseSchema.safeParse({ message: 'oops' });
    expect(result.success).toBe(false);
  });
});
