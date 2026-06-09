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
  it('accepts a canonical error without details', () => {
    const result = ApiErrorResponseSchema.safeParse({
      error: { code: 'not_found', message: 'Resource not found' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts a validation_failed error with details', () => {
    const result = ApiErrorResponseSchema.safeParse({
      error: {
        code: 'validation_failed',
        message: 'Validation failed',
        details: { name: ["can't be blank"] },
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects the legacy flat { error: string } shape', () => {
    const result = ApiErrorResponseSchema.safeParse({ error: 'not_found' });
    expect(result.success).toBe(false);
  });

  it('rejects an error object missing code or message', () => {
    const result = ApiErrorResponseSchema.safeParse({ error: { code: 'not_found' } });
    expect(result.success).toBe(false);
  });

  it('rejects a missing error field', () => {
    const result = ApiErrorResponseSchema.safeParse({ message: 'oops' });
    expect(result.success).toBe(false);
  });
});
