import {
  UserConnectionSchema,
  CreateUserConnectionInputSchema,
  ConnectionStatusSchema,
} from '../userConnectionSchemas';

describe('userConnectionSchemas', () => {
  it('accepts a valid pending row', () => {
    const row = {
      id: 'a0000000-0000-4000-8000-000000000001',
      requester_id: 'a0000000-0000-4000-8000-000000000002',
      addressee_id: 'a0000000-0000-4000-8000-000000000003',
      status: 'pending',
      blocker_id: null,
      deleted_at: null,
      inserted_at: '2026-05-27T00:00:00Z',
      updated_at: '2026-05-27T00:00:00Z',
    };
    expect(() => UserConnectionSchema.parse(row)).not.toThrow();
  });

  it('rejects unknown status', () => {
    expect(() => ConnectionStatusSchema.parse('weird')).toThrow();
  });

  it('CreateUserConnectionInputSchema requires status=pending literal', () => {
    expect(() =>
      CreateUserConnectionInputSchema.parse({
        id: 'a0000000-0000-4000-8000-000000000001',
        requester_id: 'a0000000-0000-4000-8000-000000000002',
        addressee_id: 'a0000000-0000-4000-8000-000000000003',
        status: 'accepted',
      })
    ).toThrow();
  });
});
