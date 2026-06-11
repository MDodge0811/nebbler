import { renderHook } from '@testing-library/react-native';

import { useEventStars } from '../useEventStars';

type UseQueryCall = [sql: string, params: unknown[]];
const mockUseQuery = jest.fn() as jest.MockedFunction<(...args: UseQueryCall) => unknown>;

jest.mock('@powersync/react', () => ({
  useQuery: (...args: UseQueryCall): unknown => mockUseQuery(...args),
}));

jest.mock('@hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
  }),
}));

describe('useEventStars', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty Set when there are no starred events', () => {
    // First call resolves useCurrentUser's row; second is useEventStars' query.
    mockUseQuery
      .mockReturnValueOnce({
        data: [{ id: 'user-123', primary_calendar_group_id: null }],
        isLoading: false,
        error: undefined,
      })
      .mockReturnValue({ data: [], isLoading: false, error: undefined });
    const { result } = renderHook(() => useEventStars());
    expect(result.current).toBeInstanceOf(Set);
    expect(result.current.size).toBe(0);
  });

  it('returns a Set of event_ids from non-deleted stars', () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: [{ id: 'user-123', primary_calendar_group_id: null }],
        isLoading: false,
        error: undefined,
      })
      .mockReturnValue({
        data: [
          { event_id: 'evt-1', user_id: 'user-123' },
          { event_id: 'evt-2', user_id: 'user-123' },
        ],
        isLoading: false,
        error: undefined,
      });
    const { result } = renderHook(() => useEventStars());
    expect(result.current.has('evt-1')).toBe(true);
    expect(result.current.has('evt-2')).toBe(true);
    expect(result.current.size).toBe(2);
  });

  it('calls useQuery with deleted_at IS NULL filter when user is loaded', () => {
    // Return user row on first call (useCurrentUser), empty data on second (event_stars)
    mockUseQuery
      .mockReturnValueOnce({
        data: [{ id: 'user-123', primary_calendar_group_id: null }],
        isLoading: false,
        error: undefined,
      })
      .mockReturnValue({ data: [], isLoading: false, error: undefined });
    renderHook(() => useEventStars());
    const starsCall = mockUseQuery.mock.calls.find((c) => c[0].includes('event_stars'));
    expect(starsCall?.[0]).toContain('deleted_at IS NULL');
  });

  it('queries event_stars table', () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: [{ id: 'user-123', primary_calendar_group_id: null }],
        isLoading: false,
        error: undefined,
      })
      .mockReturnValue({ data: [], isLoading: false, error: undefined });
    renderHook(() => useEventStars());
    const starsCall = mockUseQuery.mock.calls.find((c) => c[0].includes('event_stars'));
    expect(starsCall?.[0]).toContain('event_stars');
  });
});
