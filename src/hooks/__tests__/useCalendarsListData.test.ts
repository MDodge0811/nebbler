import { renderHook } from '@testing-library/react-native';
import { useCalendarsListData } from '../useCalendarsListData';

const mockUseQuery = jest.fn();

let mockGroupsReturn = {
  data: [] as unknown[],
  isLoading: false,
  error: undefined as Error | undefined,
};
let mockCalendarsReturn = {
  data: [] as unknown[],
  isLoading: false,
  error: undefined as Error | undefined,
};

jest.mock('@powersync/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock('@hooks/useCalendarGroups', () => ({
  useCalendarGroups: () => mockGroupsReturn,
}));

jest.mock('@hooks/useCalendars', () => ({
  useCalendars: () => mockCalendarsReturn,
}));

jest.mock('@hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    user: { id: 'user-1', primary_calendar_group_id: 'group-primary' },
  }),
}));

function setupMocks(opts: {
  groups?: Array<{ id: string; name: string }>;
  calendars?: Array<{ id: string; name: string }>;
  memberships?: Array<{
    calendar_group_id: string | null;
    calendar_id: string | null;
  }>;
  memberCounts?: Array<{ calendar_id: string; member_count: number }>;
  isLoading?: boolean;
  error?: Error;
}) {
  const isLoading = opts.isLoading ?? false;
  const error = opts.error ?? undefined;

  mockGroupsReturn = { data: opts.groups ?? [], isLoading, error };
  mockCalendarsReturn = { data: opts.calendars ?? [], isLoading, error };

  let callCount = 0;
  mockUseQuery.mockImplementation(() => {
    callCount++;
    if (callCount % 2 === 1) {
      return { data: opts.memberships ?? [], isLoading, error };
    }
    return { data: opts.memberCounts ?? [], isLoading, error };
  });
}

describe('useCalendarsListData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGroupsReturn = { data: [], isLoading: false, error: undefined };
    mockCalendarsReturn = { data: [], isLoading: false, error: undefined };
  });

  it('sortedGroups puts primary group first, then alphabetical', () => {
    setupMocks({
      groups: [
        { id: 'group-z', name: 'Zebra' },
        { id: 'group-primary', name: 'My Primary' },
        { id: 'group-a', name: 'Alpha' },
      ],
    });

    const { result } = renderHook(() => useCalendarsListData());
    const names = result.current.sortedGroups.map((g) => g.name);
    expect(names).toEqual(['My Primary', 'Alpha', 'Zebra']);
  });

  it('groupCalendarsMap maps group IDs to calendar IDs', () => {
    setupMocks({
      memberships: [
        { calendar_group_id: 'g1', calendar_id: 'c1' },
        { calendar_group_id: 'g1', calendar_id: 'c2' },
        { calendar_group_id: 'g2', calendar_id: 'c3' },
      ],
    });

    const { result } = renderHook(() => useCalendarsListData());
    expect(result.current.groupCalendarsMap['g1']).toEqual(['c1', 'c2']);
    expect(result.current.groupCalendarsMap['g2']).toEqual(['c3']);
  });

  it('groupCalendarsMap skips entries with null IDs', () => {
    setupMocks({
      memberships: [
        { calendar_group_id: null, calendar_id: 'c1' },
        { calendar_group_id: 'g1', calendar_id: null },
        { calendar_group_id: 'g1', calendar_id: 'c2' },
      ],
    });

    const { result } = renderHook(() => useCalendarsListData());
    expect(result.current.groupCalendarsMap['g1']).toEqual(['c2']);
    expect(Object.keys(result.current.groupCalendarsMap)).toEqual(['g1']);
  });

  it('ungroupedCalendars returns only calendars without memberships', () => {
    setupMocks({
      calendars: [
        { id: 'c1', name: 'Grouped' },
        { id: 'c2', name: 'Ungrouped' },
      ],
      memberships: [{ calendar_group_id: 'g1', calendar_id: 'c1' }],
    });

    const { result } = renderHook(() => useCalendarsListData());
    expect(result.current.ungroupedCalendars).toHaveLength(1);
    expect(result.current.ungroupedCalendars[0].id).toBe('c2');
  });

  it('returns safe defaults with empty data', () => {
    setupMocks({});

    const { result } = renderHook(() => useCalendarsListData());
    expect(result.current.sortedGroups).toEqual([]);
    expect(result.current.groupCalendarsMap).toEqual({});
    expect(result.current.ungroupedCalendars).toEqual([]);
    expect(result.current.memberCountMap).toEqual({});
    expect(result.current.calendarsById).toEqual({});
    expect(result.current.allMemberships).toEqual([]);
  });

  it('isLoading is true when any query is loading', () => {
    setupMocks({ isLoading: true });

    const { result } = renderHook(() => useCalendarsListData());
    expect(result.current.isLoading).toBe(true);
  });

  it('error is set when any query has an error', () => {
    const testError = new Error('Query failed');
    setupMocks({ error: testError });

    const { result } = renderHook(() => useCalendarsListData());
    expect(result.current.error).toBe(testError);
  });
});
