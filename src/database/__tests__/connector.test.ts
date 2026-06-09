import { UpdateType } from '@powersync/react-native';

import { PowerSyncConnector, setClerkTokenGetter } from '../connector';

let fetchSpy: jest.SpyInstance;

function transactionWith(table: string) {
  return {
    crud: [{ op: UpdateType.PUT, table, id: 'row-1', opData: { foo: 'bar' } }],
    complete: jest.fn().mockResolvedValue(undefined),
  };
}

describe('PowerSyncConnector upload guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setClerkTokenGetter(async () => 'fake.jwt');
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('skips uploads for user_connections (read-only table) — no fetch', async () => {
    const connector = new PowerSyncConnector();
    const tx = transactionWith('user_connections');
    await connector.uploadData({
      getNextCrudTransaction: jest.fn().mockResolvedValue(tx),
    } as never);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(tx.complete).toHaveBeenCalled();
  });

  it('still uploads for a normal table', async () => {
    const connector = new PowerSyncConnector();
    const tx = transactionWith('events');
    await connector.uploadData({
      getNextCrudTransaction: jest.fn().mockResolvedValue(tx),
    } as never);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/data/events/row-1'),
      expect.any(Object)
    );
  });
});
