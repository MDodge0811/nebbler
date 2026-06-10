import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React, { type ReactNode } from 'react';

import * as connectionsApi from '@api/connections';
import {
  connectionsKeys,
  useConnectionRequests,
  useUserProfileApi,
  useSendRequest,
  useResolveRequest,
  useRemoveConnection,
  useBlockUser,
} from '@hooks/useConnectionsApi';

const profileKey = [...connectionsKeys.all, 'profile'];

jest.mock('@api/connections');

const mockedApi = connectionsApi as jest.Mocked<typeof connectionsApi>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, Wrapper };
}

beforeEach(() => jest.clearAllMocks());

describe('useConnectionRequests', () => {
  it('queries listRequests and exposes the data', async () => {
    mockedApi.listRequests.mockResolvedValue({ incoming: [], outgoing: [] });
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConnectionRequests(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.listRequests).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual({ incoming: [], outgoing: [] });
  });
});

describe('useUserProfileApi', () => {
  it('does not fetch when id is undefined', () => {
    const { Wrapper } = createWrapper();
    renderHook(() => useUserProfileApi(undefined), { wrapper: Wrapper });
    expect(mockedApi.getUserProfile).not.toHaveBeenCalled();
  });
  it('fetches the profile when id is set', async () => {
    mockedApi.getUserProfile.mockResolvedValue({
      id: 'u1',
      username: 'alice',
      first_name: 'Alice',
      last_name: 'Smith',
      avatar_color: '#00DB74',
      relationship: { state: 'none', request_id: null, connection_id: null },
    });
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUserProfileApi('u1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.getUserProfile).toHaveBeenCalledWith('u1');
  });
});

describe('useSendRequest', () => {
  it('calls sendRequest and invalidates the requests + profile queries on success', async () => {
    mockedApi.sendRequest.mockResolvedValue({
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      status: 'pending',
      direction: 'outgoing',
      other_user_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      requestor_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      requestee_id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
      completed_at: null,
      inserted_at: '2026-06-09T00:00:00Z',
    });
    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useSendRequest(), { wrapper: Wrapper });
    await result.current.mutateAsync('user-id');
    expect(mockedApi.sendRequest).toHaveBeenCalledWith('user-id');
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: connectionsKeys.requests() })
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: profileKey });
  });
});

describe('useResolveRequest', () => {
  it('calls resolveRequest with id + status and invalidates requests + profiles', async () => {
    mockedApi.resolveRequest.mockResolvedValue(undefined);
    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useResolveRequest(), { wrapper: Wrapper });
    await result.current.mutateAsync({ id: 'req-1', status: 'accepted' });
    expect(mockedApi.resolveRequest).toHaveBeenCalledWith('req-1', 'accepted');
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: connectionsKeys.requests() })
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: profileKey });
  });
});

describe('useRemoveConnection', () => {
  it('calls removeConnection and invalidates the profile queries on success', async () => {
    mockedApi.removeConnection.mockResolvedValue(undefined);
    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useRemoveConnection(), { wrapper: Wrapper });
    await result.current.mutateAsync('conn-1');
    expect(mockedApi.removeConnection).toHaveBeenCalledWith('conn-1');
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: profileKey }));
  });
});

describe('useBlockUser', () => {
  it('calls blockUser and invalidates requests + profiles on success', async () => {
    mockedApi.blockUser.mockResolvedValue(undefined);
    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useBlockUser(), { wrapper: Wrapper });
    await result.current.mutateAsync('blockee-1');
    expect(mockedApi.blockUser).toHaveBeenCalledWith('blockee-1');
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: connectionsKeys.requests() })
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: profileKey });
  });
});
