import { useQuery } from '@powersync/react';
import { renderHook } from '@testing-library/react-native';

import {
  useConnections,
  useConnectionWith,
  useSharedCalendarCount,
  useSharedCalendars,
  useUserProfile,
} from '../useConnections';

// Follow the existing test pattern in __tests__/useCalendars.test.ts —
// mock @powersync/react's useQuery to return canned rows for given SQL.
// jest.mock is hoisted above these imports, so useQuery resolves to the mock.
jest.mock('@powersync/react', () => ({
  useQuery: jest.fn(),
}));

describe('useConnections', () => {
  beforeEach(() => jest.clearAllMocks());

  it('partitions rows into pendingIncoming / accepted / pendingOutgoing', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({
        // pending incoming
        data: [
          {
            id: '1',
            requester_id: 'other',
            addressee_id: 'me',
            status: 'pending',
            first_name: 'Sara',
            last_name: 'Lee',
            avatar_color: '#00DB74',
          },
        ],
        isLoading: false,
      })
      .mockReturnValueOnce({
        // accepted
        data: [
          {
            id: '2',
            requester_id: 'me',
            addressee_id: 'friend',
            status: 'accepted',
            first_name: 'Joe',
            last_name: 'B',
            avatar_color: null,
          },
        ],
        isLoading: false,
      })
      .mockReturnValueOnce({
        // pending outgoing
        data: [],
        isLoading: false,
      });

    const { result } = renderHook(() => useConnections('me'));
    expect(result.current.pendingIncoming).toHaveLength(1);
    expect(result.current.accepted).toHaveLength(1);
    expect(result.current.pendingOutgoing).toHaveLength(0);
    expect(result.current.accepted[0]!.first_name).toBe('Joe');
  });
});

describe('useConnectionWith', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when otherUserId is undefined', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false, error: undefined });
    const { result } = renderHook(() => useConnectionWith('me', undefined));
    expect(result.current).toBeNull();
  });

  it('returns null when currentUserId is undefined', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false, error: undefined });
    const { result } = renderHook(() => useConnectionWith(undefined, 'them'));
    expect(result.current).toBeNull();
  });

  it('binds query to both currentUserId and otherUserId in both directions', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false, error: undefined });
    renderHook(() => useConnectionWith('me', 'them'));
    expect(useQuery as jest.Mock).toHaveBeenCalledWith(
      expect.stringContaining('requester_id = ?'),
      ['me', 'them', 'them', 'me']
    );
  });

  it('returns the first matching row when present', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [{ id: 'c1', status: 'accepted', requester_id: 'me', addressee_id: 'them' }],
      isLoading: false,
      error: undefined,
    });
    const { result } = renderHook(() => useConnectionWith('me', 'them'));
    expect(result.current?.id).toBe('c1');
    expect(result.current?.status).toBe('accepted');
  });
});

describe('useSharedCalendarCount', () => {
  it('returns integer count when both ids are provided', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [{ count: 2 }] });
    const { result } = renderHook(() => useSharedCalendarCount('me', 'other'));
    expect(result.current).toBe(2);
  });

  it('returns 0 when currentUserId is undefined (conditional short-circuit)', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [] });
    const { result } = renderHook(() => useSharedCalendarCount(undefined, 'other'));
    expect(result.current).toBe(0);
  });

  it('returns 0 when otherUserId is undefined (conditional short-circuit)', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [] });
    const { result } = renderHook(() => useSharedCalendarCount('me', undefined));
    expect(result.current).toBe(0);
  });

  it('passes both user ids as SQL params', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [{ count: 0 }] });
    renderHook(() => useSharedCalendarCount('current-user', 'other-user'));
    expect(useQuery as jest.Mock).toHaveBeenCalledWith(
      expect.stringContaining('calendar_members'),
      ['current-user', 'other-user']
    );
  });
});

describe('useSharedCalendars', () => {
  it('returns empty array when otherUserId is undefined', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [] });
    const { result } = renderHook(() => useSharedCalendars(undefined, undefined));
    expect(result.current).toHaveLength(0);
  });

  it('returns empty array when currentUserId is undefined', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [] });
    const { result } = renderHook(() => useSharedCalendars(undefined, 'other'));
    expect(result.current).toHaveLength(0);
  });

  it('returns calendar rows when both ids are provided', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [{ id: 'cal-1', name: 'Book Club', type: 'group', color: '#FF0000' }],
    });
    const { result } = renderHook(() => useSharedCalendars('me', 'other'));
    expect(result.current).toHaveLength(1);
    expect(result.current[0]!.name).toBe('Book Club');
  });

  it('passes both user ids as SQL params (self JOIN)', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [] });
    renderHook(() => useSharedCalendars('current-user', 'other-user'));
    expect(useQuery as jest.Mock).toHaveBeenCalledWith(expect.stringContaining('cm_self'), [
      'current-user',
      'other-user',
    ]);
  });
});

describe('useUserProfile', () => {
  it('returns { user: null, isLoading: false } when not found and sync settled', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    const { result } = renderHook(() => useUserProfile('missing'));
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('returns { isLoading: true } while the local query has not resolved yet', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: true });
    const { result } = renderHook(() => useUserProfile('u1'));
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('returns the row when found', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [{ id: 'u1', first_name: 'A', last_name: 'B', avatar_color: '#00DB74' }],
      isLoading: false,
    });
    const { result } = renderHook(() => useUserProfile('u1'));
    expect(result.current.user?.id).toBe('u1');
  });

  it('does not flag isLoading when no userId is provided (no query was issued)', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: true });
    const { result } = renderHook(() => useUserProfile(undefined));
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useConnectionWith updated_at', () => {
  it('returns updated_at on the active row', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'c1',
          status: 'accepted',
          requester_id: 'me',
          addressee_id: 'them',
          updated_at: '2026-01-15T00:00:00Z',
        },
      ],
      isLoading: false,
    });
    const { result } = renderHook(() => useConnectionWith('me', 'them'));
    expect(result.current?.updated_at).toBe('2026-01-15T00:00:00Z');
  });

  it('SELECT includes updated_at', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    renderHook(() => useConnectionWith('me', 'them'));
    expect(useQuery as jest.Mock).toHaveBeenCalledWith(
      expect.stringContaining('updated_at'),
      expect.any(Array)
    );
  });
});
