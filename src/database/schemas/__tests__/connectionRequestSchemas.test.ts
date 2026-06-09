import {
  ConnectionRequestSchema,
  ConnectionRequestItemSchema,
  ConnectionRequestListResponseSchema,
} from '@database/schemas';

const user = {
  id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
  username: 'alice',
  first_name: 'Alice',
  last_name: 'Smith',
  avatar_color: '#00DB74',
};
const item = {
  id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
  user,
  requested_at: '2026-06-09T00:00:00Z',
};

describe('ConnectionRequestItemSchema', () => {
  it('accepts a valid item', () => {
    expect(() => ConnectionRequestItemSchema.parse(item)).not.toThrow();
  });
  it('rejects an item whose user lacks username', () => {
    expect(() =>
      ConnectionRequestItemSchema.parse({ ...item, user: { ...user, username: undefined } })
    ).toThrow();
  });
  it('rejects a non-uuid id', () => {
    expect(() => ConnectionRequestItemSchema.parse({ ...item, id: 'nope' })).toThrow();
  });
});

describe('ConnectionRequestListResponseSchema', () => {
  it('accepts incoming + outgoing arrays', () => {
    expect(() =>
      ConnectionRequestListResponseSchema.parse({ incoming: [item], outgoing: [] })
    ).not.toThrow();
  });
  it('rejects when a direction key is missing', () => {
    expect(() => ConnectionRequestListResponseSchema.parse({ incoming: [item] })).toThrow();
  });
});

describe('ConnectionRequestSchema (created request)', () => {
  it('accepts a created request and strips extra keys', () => {
    const parsed = ConnectionRequestSchema.parse({
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      requested_at: '2026-06-09T00:00:00Z',
      extra: 'ignored',
    });
    expect(parsed).not.toHaveProperty('extra');
  });
  it('rejects a missing id', () => {
    expect(() => ConnectionRequestSchema.parse({ requested_at: '2026-06-09T00:00:00Z' })).toThrow();
  });
});
