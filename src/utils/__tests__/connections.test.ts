import {
  sendConnectionRequest,
  acceptConnection,
  declineConnection,
  cancelSentRequest,
  removeConnection,
  blockUser,
} from '@utils/connections';

// Mock getDatabase so we never touch real SQLite in tests
const mockExecute = jest.fn();
const mockGetOptional = jest.fn();

jest.mock('@database/database', () => ({
  getDatabase: jest.fn(() => ({
    execute: mockExecute,
    getOptional: mockGetOptional,
  })),
}));

describe('sendConnectionRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecute.mockResolvedValue({
      rows: { _array: [{ id: 'generated-uuid' }] },
    });
  });

  it('INSERTs a pending row and returns the generated id', async () => {
    const id = await sendConnectionRequest('addressee-uuid', 'requester-uuid');
    expect(id).toBe('generated-uuid');
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO user_connections'),
      expect.arrayContaining(['requester-uuid', 'addressee-uuid', 'pending'])
    );
  });

  it('uses parameterised SQL — no string interpolation', async () => {
    await sendConnectionRequest('xxxx-unique-id', 'yyyy-unique-id');
    const [sql] = mockExecute.mock.calls[0] as [string, unknown[]];
    // No raw IDs baked into the SQL string
    expect(sql).not.toContain('xxxx-unique-id');
    expect(sql).not.toContain('yyyy-unique-id');
  });
});

describe('acceptConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { _array: [] } });
  });

  it('UPDATEs status to accepted', async () => {
    await acceptConnection('conn-id');
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE user_connections'),
      expect.arrayContaining(['accepted', 'conn-id'])
    );
  });
});

describe('declineConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { _array: [] } });
  });

  it('UPDATEs status to declined', async () => {
    await declineConnection('conn-id');
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE user_connections'),
      expect.arrayContaining(['declined', 'conn-id'])
    );
  });
});

describe('cancelSentRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { _array: [] } });
  });

  it('sets deleted_at to soft-delete the row', async () => {
    await cancelSentRequest('conn-id');
    const [sql, params] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('deleted_at');
    expect(params).toContain('conn-id');
  });
});

describe('removeConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { _array: [] } });
  });

  it('sets deleted_at to soft-delete the row', async () => {
    await removeConnection('conn-id');
    const [sql, params] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('deleted_at');
    expect(params).toContain('conn-id');
  });
});

describe('blockUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { _array: [] } });
  });

  it('UPDATEs an existing active row to blocked', async () => {
    mockGetOptional.mockResolvedValue({ id: 'existing-conn-id' });
    await blockUser('other-user-uuid', 'current-user-uuid');
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE user_connections'),
      expect.arrayContaining(['blocked', 'current-user-uuid', 'existing-conn-id'])
    );
  });

  it('INSERTs a pending row then UPDATEs to blocked when no active connection exists', async () => {
    mockGetOptional.mockResolvedValue(null);
    // First execute is the INSERT (returns new id); second is the UPDATE
    mockExecute
      .mockResolvedValueOnce({ rows: { _array: [{ id: 'new-conn-id' }] } })
      .mockResolvedValueOnce({ rows: { _array: [] } });

    await blockUser('other-user-uuid', 'current-user-uuid');

    expect(mockExecute).toHaveBeenCalledTimes(2);

    // First call: INSERT as pending
    const [insertSql, insertParams] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(insertSql).toContain('INSERT INTO user_connections');
    expect(insertParams).toContain('pending');
    expect(insertParams).not.toContain('blocked');

    // Second call: UPDATE to blocked + set blocker_id
    const [updateSql, updateParams] = mockExecute.mock.calls[1] as [string, unknown[]];
    expect(updateSql).toContain('UPDATE user_connections');
    expect(updateParams).toContain('blocked');
    expect(updateParams).toContain('current-user-uuid');
    expect(updateParams).toContain('new-conn-id');
  });
});
