import { UserConnectionSchema } from '../userConnectionSchemas';

describe('UserConnectionSchema (read-only synced pair)', () => {
  const validRow = {
    id: 'a0000000-0000-4000-8000-000000000001',
    user_a_id: 'a0000000-0000-4000-8000-000000000002',
    user_b_id: 'a0000000-0000-4000-8000-000000000003',
    inserted_at: '2026-06-08T00:00:00Z',
    updated_at: '2026-06-08T00:00:00Z',
  };

  it('accepts a valid synced row', () => {
    expect(() => UserConnectionSchema.parse(validRow)).not.toThrow();
  });

  it('rejects a non-uuid id', () => {
    expect(() => UserConnectionSchema.parse({ ...validRow, id: 'not-a-uuid' })).toThrow();
  });

  it('rejects a non-uuid participant', () => {
    expect(() => UserConnectionSchema.parse({ ...validRow, user_a_id: 'nope' })).toThrow();
  });

  it('rejects a missing participant', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_b_id: _omit, ...withoutB } = validRow;
    expect(() => UserConnectionSchema.parse(withoutB)).toThrow();
  });

  it('exposes no write-input schema', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mod: Record<string, unknown> = require('../userConnectionSchemas');
    expect(mod['CreateUserConnectionInputSchema']).toBeUndefined();
    expect(mod['UpdateUserConnectionInputSchema']).toBeUndefined();
    expect(mod['ConnectionStatusSchema']).toBeUndefined();
  });
});
