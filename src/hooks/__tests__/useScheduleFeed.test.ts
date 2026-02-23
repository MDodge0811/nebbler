import { renderHook } from '@testing-library/react-native';
import { buildSections, isEmptySentinel, useScheduleFeed } from '../useScheduleFeed';
import type { FeedEvent, EmptySentinel } from '../useScheduleFeed';

const mockUseQuery = jest.fn().mockReturnValue({ data: [], isLoading: false, error: undefined });

jest.mock('@powersync/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock('@hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
  }),
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

describe('isEmptySentinel', () => {
  it('returns true for empty sentinel objects', () => {
    const sentinel: EmptySentinel = { _empty: true, id: 'empty-2026-02-24' };
    expect(isEmptySentinel(sentinel)).toBe(true);
  });

  it('returns false for FeedEvent objects', () => {
    expect(isEmptySentinel(makeFeedEvent())).toBe(false);
  });
});

describe('buildSections', () => {
  it('creates a section for each date in the range', () => {
    const sections = buildSections([], '2026-02-24', '2026-02-26');
    expect(sections).toHaveLength(3);
    expect(sections[0].title).toBe('2026-02-24');
    expect(sections[1].title).toBe('2026-02-25');
    expect(sections[2].title).toBe('2026-02-26');
  });

  it('fills empty days with a sentinel item', () => {
    const sections = buildSections([], '2026-02-24', '2026-02-24');
    expect(sections[0].data).toHaveLength(1);
    expect(isEmptySentinel(sections[0].data[0])).toBe(true);
  });

  it('groups events into their respective date sections', () => {
    const events = [
      makeFeedEvent({ id: 'evt-1', start_time: '2026-02-24T10:00:00Z' }),
      makeFeedEvent({ id: 'evt-2', start_time: '2026-02-24T14:00:00Z' }),
      makeFeedEvent({ id: 'evt-3', start_time: '2026-02-25T09:00:00Z' }),
    ];
    const sections = buildSections(events, '2026-02-24', '2026-02-25');

    expect(sections[0].data).toHaveLength(2);
    expect(sections[1].data).toHaveLength(1);
    expect(isEmptySentinel(sections[0].data[0])).toBe(false);
  });

  it('skips events with null start_time', () => {
    const events = [makeFeedEvent({ start_time: null as unknown as string })];
    const sections = buildSections(events, '2026-02-24', '2026-02-24');
    expect(isEmptySentinel(sections[0].data[0])).toBe(true);
  });
});

describe('useScheduleFeed', () => {
  beforeEach(() => {
    mockUseQuery.mockClear();
    // First call: useCurrentUser's useQuery
    // Second call: useCalendarGroupMemberships's useQuery
    // Third call: the feed events query
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
      .mockReturnValueOnce({ data: [], isLoading: false, error: undefined });
  });

  it('returns sections for the date range', () => {
    const { result } = renderHook(() => useScheduleFeed('2026-02-24', '2026-02-25'));
    expect(result.current.sections).toHaveLength(2);
  });

  it('builds SQL with calendar IDs from memberships', () => {
    renderHook(() => useScheduleFeed('2026-02-24', '2026-02-25'));

    // Third useQuery call should be the events query with calendar_id IN (?)
    const thirdCall = mockUseQuery.mock.calls[2];
    expect(thirdCall[0]).toContain('calendar_id IN');
    expect(thirdCall[1]).toContain('cal-1');
  });
});
