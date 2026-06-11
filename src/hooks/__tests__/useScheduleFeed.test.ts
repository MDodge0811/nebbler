import { renderHook } from '@testing-library/react-native';

import { useScheduleFeed } from '../useScheduleFeed';
import type { FeedEvent } from '../useScheduleFeed';

const mockUseQuery = jest.fn().mockReturnValue({ data: [], isLoading: false, error: undefined });

jest.mock('@powersync/react', () => ({
  useQuery: (...args: unknown[]): unknown => mockUseQuery(...args),
}));

jest.mock('@hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
  }),
}));

const mockStarredIds = new Set<string>();
jest.mock('@hooks/useEventStars', () => ({
  useEventStars: () => mockStarredIds,
}));

jest.mock('@stores/useScheduleStore', () => ({
  useScheduleStore: (selector: (s: { starredOnly: boolean }) => unknown) =>
    selector({ starredOnly: false }),
}));

function makeFeedEvent(overrides: Partial<FeedEvent> = {}): FeedEvent {
  return {
    id: 'evt-1',
    calendar_id: 'cal-1',
    created_by_user_id: 'user-1',
    title: 'Test Event',
    description: '',
    start_time: '2026-02-24T14:00:00Z',
    end_time: '2026-02-24T16:00:00Z',
    is_recurring: 0,
    deleted_at: null,
    inserted_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    calendar_name: 'My Calendar',
    calendar_type: 'private',
    ...overrides,
  } as FeedEvent;
}

describe('useScheduleFeed', () => {
  beforeEach(() => {
    mockUseQuery.mockClear();
    // First call: useCurrentUser's useQuery
    // Second call: useCalendarGroupMemberships's useQuery
    // Third call: the feed events query
    // Fourth call: member view modes query
    // Fifth call: event responses query
    mockUseQuery
      .mockReturnValueOnce({
        data: [{ id: 'user-123', primary_calendar_group_id: 'group-1' }],
        isLoading: false,
        error: undefined,
      })
      .mockReturnValueOnce({
        data: [{ calendar_group_id: 'group-1', calendar_id: 'cal-1' }],
        isLoading: false,
        error: undefined,
      })
      .mockReturnValueOnce({ data: [], isLoading: false, error: undefined })
      .mockReturnValueOnce({ data: [], isLoading: false, error: undefined })
      .mockReturnValueOnce({ data: [], isLoading: false, error: undefined });
  });

  it('returns rows for the date range', () => {
    const { result } = renderHook(() => useScheduleFeed('2026-02-24', '2026-02-25'));
    // 2 days → 2 day-header rows + quiet-day rows for each
    expect(result.current.rows.length).toBeGreaterThanOrEqual(2);
  });

  it('returns indexByDate mapping each date to its day-header row index', () => {
    const { result } = renderHook(() => useScheduleFeed('2026-02-24', '2026-02-25'));
    expect(result.current.indexByDate.has('2026-02-24')).toBe(true);
    expect(result.current.indexByDate.has('2026-02-25')).toBe(true);
  });

  it('day-header row is at the index given by indexByDate', () => {
    const { result } = renderHook(() => useScheduleFeed('2026-02-24', '2026-02-25'));
    const { rows, indexByDate } = result.current;
    const idx = indexByDate.get('2026-02-24');
    if (idx === undefined) throw new Error('indexByDate should contain 2026-02-24');
    expect(rows[idx]?.kind).toBe('day-header');
  });

  it('builds SQL with calendar IDs from memberships', () => {
    renderHook(() => useScheduleFeed('2026-02-24', '2026-02-25'));

    // Third useQuery call should be the events query with calendar_id IN (?)
    const thirdCall = mockUseQuery.mock.calls[2] as [string, string[]];
    expect(thirdCall[0]).toContain('calendar_id IN');
    expect(thirdCall[1]).toContain('cal-1');
  });

  it('returns isLoading from the events query', () => {
    mockUseQuery.mockReset();
    mockUseQuery
      .mockReturnValueOnce({
        data: [{ id: 'user-123', primary_calendar_group_id: 'group-1' }],
        isLoading: false,
        error: undefined,
      })
      .mockReturnValueOnce({
        data: [{ calendar_group_id: 'group-1', calendar_id: 'cal-1' }],
        isLoading: false,
        error: undefined,
      })
      .mockReturnValueOnce({ data: [], isLoading: true, error: undefined })
      .mockReturnValueOnce({ data: [], isLoading: false, error: undefined })
      .mockReturnValueOnce({ data: [], isLoading: false, error: undefined });

    const { result } = renderHook(() => useScheduleFeed('2026-02-24', '2026-02-25'));
    expect(result.current.isLoading).toBe(true);
  });

  it('includes event rows when events are present', () => {
    mockUseQuery.mockReset();
    const events = [
      makeFeedEvent({
        id: 'evt-1',
        start_time: '2026-02-24T10:00:00Z',
        end_time: '2026-02-24T11:00:00Z',
      }),
    ];
    mockUseQuery
      .mockReturnValueOnce({
        data: [{ id: 'user-123', primary_calendar_group_id: 'group-1' }],
        isLoading: false,
        error: undefined,
      })
      .mockReturnValueOnce({
        data: [{ calendar_group_id: 'group-1', calendar_id: 'cal-1' }],
        isLoading: false,
        error: undefined,
      })
      .mockReturnValueOnce({ data: events, isLoading: false, error: undefined })
      .mockReturnValueOnce({ data: [], isLoading: false, error: undefined })
      .mockReturnValueOnce({ data: [], isLoading: false, error: undefined });

    const { result } = renderHook(() => useScheduleFeed('2026-02-24', '2026-02-24'));
    const eventRows = result.current.rows.filter((r) => r.kind === 'event');
    expect(eventRows.length).toBe(1);
  });
});
