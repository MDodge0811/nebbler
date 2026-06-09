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

describe('useConnections (reads-only connected list)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the connected list and resolves other_user_id when me = user_a', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [
        { id: '1', other_user_id: 'friend', first_name: 'Joe', last_name: 'B', avatar_color: null },
      ],
      isLoading: false,
    });
    const { result } = renderHook(() => useConnections('me'));
    expect(result.current.connections).toHaveLength(1);
    expect(result.current.connections[0]?.other_user_id).toBe('friend');
  });

  it('binds the query with me on both sides of the pair', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    renderHook(() => useConnections('me'));
    expect(useQuery as jest.Mock).toHaveBeenCalledWith(expect.stringContaining('user_a_id'), [
      'me',
      'me',
      'me',
      'me',
    ]);
  });

  it('is inert (no rows) when currentUserId is undefined', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    const { result } = renderHook(() => useConnections(undefined));
    expect(result.current.connections).toHaveLength(0);
  });
});

describe('useConnectionWith (presence = connected)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null when either id is undefined', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    const { result } = renderHook(() => useConnectionWith('me', undefined));
    expect(result.current).toBeNull();
  });

  it('binds both directions of the pair', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    renderHook(() => useConnectionWith('me', 'them'));
    expect(useQuery as jest.Mock).toHaveBeenCalledWith(expect.stringContaining('user_a_id = ?'), [
      'me',
      'them',
      'them',
      'me',
    ]);
  });

  it('returns the connection id when a row exists', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [{ id: 'c1' }], isLoading: false });
    const { result } = renderHook(() => useConnectionWith('me', 'them'));
    expect(result.current?.id).toBe('c1');
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
    expect(result.current[0]?.name).toBe('Book Club');
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
  it('returns null when not found', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [] });
    const { result } = renderHook(() => useUserProfile('missing'));
    expect(result.current).toBeNull();
  });
});
