import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React, { type ReactNode } from 'react';

import * as userSearchApi from '@api/userSearch';
import { useUserSearch } from '@hooks/useUserSearch';

jest.mock('@api/userSearch');
const mockedApi = userSearchApi as jest.Mocked<typeof userSearchApi>;

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
}

beforeEach(() => jest.clearAllMocks());

describe('useUserSearch', () => {
  it('does not query for a query shorter than 2 chars', () => {
    renderHook(() => useUserSearch('a'), { wrapper: createWrapper() });
    expect(mockedApi.searchUsers).not.toHaveBeenCalled();
  });

  it('queries searchUsers for a >=2-char query and exposes the results', async () => {
    mockedApi.searchUsers.mockResolvedValue([
      {
        id: 'u1',
        username: 'alice',
        first_name: 'Alice',
        last_name: 'Smith',
        avatar_color: '#00DB74',
        relationship: { state: 'none', request_id: null, connection_id: null },
      },
    ]);
    const { result } = renderHook(() => useUserSearch('alice'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.searchUsers).toHaveBeenCalledWith('alice');
    expect(result.current.data).toHaveLength(1);
  });
});
