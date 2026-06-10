import { renderHook } from '@testing-library/react-native';

import { useCalendarMemberUserIds } from '../useCalendarMembers';

const mockUseQuery = jest.fn();

jest.mock('@powersync/react', () => ({
  useQuery: (...args: unknown[]): unknown => mockUseQuery(...args),
  usePowerSync: (): unknown => ({ execute: jest.fn() }),
}));

describe('useCalendarMemberUserIds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queries members for the given calendar id', () => {
    mockUseQuery.mockReturnValue({ data: [] });
    renderHook(() => useCalendarMemberUserIds('cal-1'));
    expect(mockUseQuery).toHaveBeenCalledWith(expect.stringContaining('calendar_members'), [
      'cal-1',
    ]);
  });

  it('returns the de-duplicated list of member user ids', () => {
    mockUseQuery.mockReturnValue({
      data: [{ user_id: 'm-1' }, { user_id: 'm-2' }, { user_id: 'm-1' }],
    });
    const { result } = renderHook(() => useCalendarMemberUserIds('cal-1'));
    expect([...result.current].sort()).toEqual(['m-1', 'm-2']);
  });

  it('returns an empty list when no calendarId is provided', () => {
    mockUseQuery.mockReturnValue({ data: [] });
    const { result } = renderHook(() => useCalendarMemberUserIds(undefined));
    expect(result.current).toEqual([]);
  });
});
