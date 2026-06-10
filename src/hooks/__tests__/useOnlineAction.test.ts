import type { UseMutationResult } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';

import { useOnlineAction } from '../useOnlineAction';

const mockUseSyncStatus = jest.fn();
jest.mock('../useSyncStatus', () => ({
  useSyncStatus: () => mockUseSyncStatus() as { isConnected: boolean },
}));

// Stub the api-layer message mapper so this unit test never loads the real client.
jest.mock('@api/connections', () => ({
  connectionErrorMessage: (e: unknown) => (e instanceof Error ? e.message : 'err'),
}));

type Mutation = UseMutationResult<unknown, unknown, string>;

function fakeMutation(over: Partial<Mutation> = {}): Mutation {
  return {
    mutateAsync: jest.fn().mockResolvedValue(undefined),
    isPending: false,
    ...over,
  } as unknown as Mutation;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseSyncStatus.mockReturnValue({ isConnected: true });
});

describe('useOnlineAction', () => {
  it('short-circuits to offline and never calls the mutation when disconnected', async () => {
    mockUseSyncStatus.mockReturnValue({ isConnected: false });
    const mutation = fakeMutation();
    const { result } = renderHook(() => useOnlineAction(mutation));

    const outcome = await result.current.run('user-1');

    expect(outcome.status).toBe('offline');
    expect(mutation.mutateAsync).not.toHaveBeenCalled();
  });

  it('runs the mutation and returns success when online', async () => {
    const mutation = fakeMutation();
    const { result } = renderHook(() => useOnlineAction(mutation));

    const outcome = await result.current.run('user-1');

    expect(outcome.status).toBe('success');
    expect(mutation.mutateAsync).toHaveBeenCalledWith('user-1');
  });

  it('returns a typed error result (not a throw) when the mutation rejects', async () => {
    const mutation = fakeMutation({
      mutateAsync: jest.fn().mockRejectedValue(new Error('boom')),
    });
    const { result } = renderHook(() => useOnlineAction(mutation));

    const outcome = await result.current.run('user-1');

    expect(outcome).toEqual(expect.objectContaining({ status: 'error', message: 'boom' }));
  });

  it('does not resolve success until the mutation resolves (no optimistic state)', async () => {
    let resolveMutation: () => void = () => {};
    const pending = new Promise<void>((resolve) => {
      resolveMutation = resolve;
    });
    const mutation = fakeMutation({ mutateAsync: jest.fn().mockReturnValue(pending) });
    const { result } = renderHook(() => useOnlineAction(mutation));

    let settled = false;
    const runPromise = result.current.run('user-1').then((r) => {
      settled = true;
      return r;
    });

    // Nothing optimistic — the action is still in flight until the server confirms.
    await Promise.resolve();
    expect(settled).toBe(false);

    resolveMutation();
    expect((await runPromise).status).toBe('success');
  });

  it('passes through the mutation in-flight flag for disable + spinner', () => {
    const { result } = renderHook(() => useOnlineAction(fakeMutation({ isPending: true })));
    expect(result.current.isPending).toBe(true);
  });
});
