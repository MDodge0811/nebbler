import {
  ConnectionRequestSchema,
  ConnectionRequestEnvelopeSchema,
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

const createdRequest = {
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  status: 'pending',
  direction: 'outgoing',
  other_user_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  requestor_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  requestee_id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
  completed_at: null,
  inserted_at: '2026-06-09T00:00:00Z',
};

describe('ConnectionRequestSchema (created/resolved request)', () => {
  it('accepts a valid request', () => {
    expect(() => ConnectionRequestSchema.parse(createdRequest)).not.toThrow();
  });
  it('rejects a non-uuid id', () => {
    expect(() => ConnectionRequestSchema.parse({ ...createdRequest, id: 'nope' })).toThrow();
  });
  it('rejects an invalid status', () => {
    expect(() => ConnectionRequestSchema.parse({ ...createdRequest, status: 'bogus' })).toThrow();
  });
});

describe('ConnectionRequestEnvelopeSchema', () => {
  it('parses the wrapped request', () => {
    const parsed = ConnectionRequestEnvelopeSchema.parse({ connection_request: createdRequest });
    expect(parsed.connection_request.id).toBe(createdRequest.id);
  });
  it('rejects a missing connection_request wrapper', () => {
    expect(() => ConnectionRequestEnvelopeSchema.parse(createdRequest)).toThrow();
  });
});
