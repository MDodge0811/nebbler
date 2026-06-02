import { renderHook } from '@testing-library/react-native';

import { useCurrentUser, useCurrentUserMutations } from '@hooks/useCurrentUser';

const mockUseAuth = jest.fn();
const mockUseQuery = jest.fn();
const mockExecute = jest.fn();

jest.mock('@hooks/useAuth', () => ({
  useAuth: (): unknown => mockUseAuth(),
}));

jest.mock('@powersync/react', () => ({
  useQuery: (...args: unknown[]): unknown => mockUseQuery(...args),
  usePowerSync: () => ({ execute: mockExecute }),
}));

describe('useCurrentUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queries the users table with the authenticated user ID', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });
    mockUseQuery.mockReturnValue({ data: [], isLoading: false, error: undefined });

    renderHook(() => useCurrentUser());

    expect(mockUseQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', ['user-123']);
  });

  it('returns the database user when available', () => {
    const dbUser = {
      id: 'user-123',
      first_name: 'Alice',
      last_name: 'Smith',
      email: 'alice@example.com',
      display_name: 'Alice S',
      inserted_at: '2025-01-01',
      updated_at: '2025-01-01',
    };

    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'alice@example.com' },
    });
    mockUseQuery.mockReturnValue({ data: [dbUser], isLoading: false, error: undefined });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.user).toEqual(dbUser);
    expect(result.current.authUser).toEqual({ id: 'user-123', email: 'alice@example.com' });
  });

  it('returns null user when data has not synced yet', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });
    mockUseQuery.mockReturnValue({ data: [], isLoading: true, error: undefined });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('handles no authenticated user gracefully', () => {
    mockUseAuth.mockReturnValue({ user: null });
    mockUseQuery.mockReturnValue({ data: [], isLoading: false, error: undefined });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.user).toBeNull();
    expect(result.current.authUser).toBeNull();
    expect(mockUseQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE 0', []);
  });
});

describe('useCurrentUserMutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updateAvatarColor writes uppercased hex scoped to the user id', async () => {
    const { result } = renderHook(() => useCurrentUserMutations());

    await result.current.updateAvatarColor('user-123', '#00db74');

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users SET avatar_color = ?, updated_at = ? WHERE id = ?'),
      expect.arrayContaining(['#00DB74', 'user-123'])
    );
  });
});
