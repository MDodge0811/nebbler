import {
  ApiErrorResponseSchema,
  FetchCredentialsResponseSchema,
  RelationshipSchema,
  RelationshipStateSchema,
  BasicUserSchema,
  UserSearchResultSchema,
  UserProfileResponseSchema,
} from '../apiSchemas';

const basicUser = {
  id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
  username: 'alice',
  first_name: 'Alice',
  last_name: 'Smith',
  avatar_color: '#00DB74',
};

const relationship = { state: 'none', request_id: null, connection_id: null };

describe('RelationshipStateSchema', () => {
  it.each(['none', 'outgoing_pending', 'incoming_pending', 'connected', 'self'])(
    'accepts %s',
    (state) => expect(() => RelationshipStateSchema.parse(state)).not.toThrow()
  );
  it('rejects an unknown state', () => {
    expect(() => RelationshipStateSchema.parse('blocked')).toThrow();
  });
});

describe('RelationshipSchema', () => {
  it('accepts a pending relationship with a request_id', () => {
    expect(() =>
      RelationshipSchema.parse({
        state: 'incoming_pending',
        request_id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
        connection_id: null,
      })
    ).not.toThrow();
  });
  it('accepts a connected relationship with a connection_id', () => {
    expect(() =>
      RelationshipSchema.parse({
        state: 'connected',
        request_id: null,
        connection_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      })
    ).not.toThrow();
  });
  it('rejects a non-uuid request_id', () => {
    expect(() =>
      RelationshipSchema.parse({
        state: 'outgoing_pending',
        request_id: 'nope',
        connection_id: null,
      })
    ).toThrow();
  });
});

describe('BasicUserSchema', () => {
  it('accepts a basic user', () => {
    expect(() => BasicUserSchema.parse(basicUser)).not.toThrow();
  });
  it('rejects a missing username', () => {
    const withoutUsername = { ...basicUser, username: undefined };
    expect(() => BasicUserSchema.parse(withoutUsername)).toThrow();
  });
  it('accepts a null username', () => {
    expect(() => BasicUserSchema.parse({ ...basicUser, username: null })).not.toThrow();
  });
  it('accepts null first/last name and avatar_color', () => {
    expect(() =>
      BasicUserSchema.parse({ ...basicUser, first_name: null, last_name: null, avatar_color: null })
    ).not.toThrow();
  });
});

describe('UserSearchResultSchema / UserProfileResponseSchema', () => {
  it('accepts a search result with username + relationship', () => {
    expect(() => UserSearchResultSchema.parse({ ...basicUser, relationship })).not.toThrow();
  });
  it('rejects a search result missing relationship', () => {
    expect(() => UserSearchResultSchema.parse(basicUser)).toThrow();
  });
  it('accepts a profile response', () => {
    expect(() => UserProfileResponseSchema.parse({ ...basicUser, relationship })).not.toThrow();
  });
});

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
