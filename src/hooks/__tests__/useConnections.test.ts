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
jest.mock('@powersync/react', () => ({
  useQuery: jest.fn(),
}));

import { useQuery } from '@powersync/react';

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
    expect(result.current.accepted[0].first_name).toBe('Joe');
  });
});

describe('useConnectionWith', () => {
  it('returns null when userId is undefined', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [] });
    const { result } = renderHook(() => useConnectionWith(undefined));
    expect(result.current).toBeNull();
  });

  it('returns the single row when one matches', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [{ id: '1', status: 'accepted' }],
    });
    const { result } = renderHook(() => useConnectionWith('other-user-id'));
    expect(result.current?.id).toBe('1');
  });
});

describe('useSharedCalendarCount', () => {
  it('returns integer count', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [{ count: 2 }] });
    const { result } = renderHook(() => useSharedCalendarCount('other'));
    expect(result.current).toBe(2);
  });
});

describe('useSharedCalendars', () => {
  it('returns empty array when otherUserId is undefined', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [] });
    const { result } = renderHook(() => useSharedCalendars(undefined));
    expect(result.current).toHaveLength(0);
  });
});

describe('useUserProfile', () => {
  it('returns null when not found', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [] });
    const { result } = renderHook(() => useUserProfile('missing'));
    expect(result.current).toBeNull();
  });
});
