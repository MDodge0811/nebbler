import { renderHook } from '@testing-library/react-native';

import type { Event } from '@database/schema';

import { useCalendarEvents, useMarkedDates } from '../useCalendarEvents';

const mockUseQuery = jest.fn().mockReturnValue({ data: [], isLoading: false, error: undefined });

jest.mock('@powersync/react', () => ({
  useQuery: (...args: unknown[]): unknown => mockUseQuery(...args),
}));

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'evt-1',
    calendar_id: 'cal-1',
    created_by_user_id: 'user-1',
    title: 'Test Event',
    description: '',
    start_time: '2026-02-15T10:00:00Z',
    end_time: '2026-02-15T11:00:00Z',
    deleted_at: null,
    inserted_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    ...overrides,
  } as Event;
}

describe('useCalendarEvents', () => {
  beforeEach(() => {
    mockUseQuery.mockClear();
  });

  it('calls useQuery with correct SQL and date-range parameters', () => {
    renderHook(() => useCalendarEvents('2026-02-01', '2026-02-28'));

    expect(mockUseQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM events'), [
      '2026-02-28T23:59:59Z',
      '2026-02-01T00:00:00Z',
    ]);
  });

  it('includes deleted_at IS NULL filter in the SQL', () => {
    renderHook(() => useCalendarEvents('2026-02-01', '2026-02-28'));

    const sql = (mockUseQuery.mock.calls[0] as [string])[0];
    expect(sql).toContain('deleted_at IS NULL');
  });
});

describe('useMarkedDates', () => {
  it('returns a stable empty object reference when no events', () => {
    const { result, rerender } = renderHook(() => useMarkedDates([]));
    const first = result.current;
    rerender(undefined);
    expect(result.current).toBe(first);
  });

  it('marks dates that have events with calendar color and not starred', () => {
    const events = [makeEvent({ start_time: '2026-02-15T10:00:00Z', calendar_id: 'cal-1' })];
    const { result } = renderHook(() => useMarkedDates(events));

    expect(result.current['2026-02-15']).toBeDefined();
    expect(result.current['2026-02-15']?.colors).toHaveLength(1);
    expect(result.current['2026-02-15']?.starred).toBe(false);
  });

  it('deduplicates same-calendar events on the same date (one color entry)', () => {
    const events = [
      makeEvent({ id: 'evt-1', start_time: '2026-02-15T10:00:00Z', calendar_id: 'cal-1' }),
      makeEvent({ id: 'evt-2', start_time: '2026-02-15T14:00:00Z', calendar_id: 'cal-1' }),
    ];
    const { result } = renderHook(() => useMarkedDates(events));

    expect(Object.keys(result.current)).toHaveLength(1);
    // Same calendar → same color → deduplicated to 1 color
    expect(result.current['2026-02-15']?.colors).toHaveLength(1);
  });

  it('collects distinct calendar colors on the same date (up to 3)', () => {
    const events = [
      makeEvent({ id: 'evt-1', start_time: '2026-02-15T10:00:00Z', calendar_id: 'cal-a' }),
      makeEvent({ id: 'evt-2', start_time: '2026-02-15T12:00:00Z', calendar_id: 'cal-b' }),
      makeEvent({ id: 'evt-3', start_time: '2026-02-15T14:00:00Z', calendar_id: 'cal-c' }),
      makeEvent({ id: 'evt-4', start_time: '2026-02-15T16:00:00Z', calendar_id: 'cal-d' }),
    ];
    const { result } = renderHook(() => useMarkedDates(events));

    // Should cap at 3 distinct colors
    const colors = result.current['2026-02-15']?.colors ?? [];
    expect(colors.length).toBeLessThanOrEqual(3);
    expect(colors.length).toBeGreaterThanOrEqual(1);
  });

  it('marks multiple different dates', () => {
    const events = [
      makeEvent({ id: 'evt-1', start_time: '2026-02-10T09:00:00Z' }),
      makeEvent({ id: 'evt-2', start_time: '2026-02-20T15:00:00Z' }),
    ];
    const { result } = renderHook(() => useMarkedDates(events));

    expect(Object.keys(result.current)).toHaveLength(2);
    expect(result.current['2026-02-10']).toBeDefined();
    expect(result.current['2026-02-20']).toBeDefined();
  });

  it('skips events with null start_time', () => {
    const events = [makeEvent({ start_time: null as unknown as string })];
    const { result } = renderHook(() => useMarkedDates(events));
    expect(result.current).toEqual({});
  });

  it('skips events with invalid start_time', () => {
    const events = [makeEvent({ start_time: 'not-a-date' })];
    const { result } = renderHook(() => useMarkedDates(events));
    expect(result.current).toEqual({});
  });

  it('marks date as starred when event id is in starredIds set', () => {
    const events = [makeEvent({ id: 'evt-1', start_time: '2026-02-15T10:00:00Z' })];
    const starredIds = new Set(['evt-1']);
    const { result } = renderHook(() => useMarkedDates(events, starredIds));

    expect(result.current['2026-02-15']?.starred).toBe(true);
  });

  it('does not mark date as starred when no event on it is in starredIds', () => {
    const events = [makeEvent({ id: 'evt-1', start_time: '2026-02-15T10:00:00Z' })];
    const starredIds = new Set(['evt-999']);
    const { result } = renderHook(() => useMarkedDates(events, starredIds));

    expect(result.current['2026-02-15']?.starred).toBe(false);
  });

  it('marks date starred when at least one event on it is starred', () => {
    const events = [
      makeEvent({ id: 'evt-1', start_time: '2026-02-15T10:00:00Z', calendar_id: 'cal-1' }),
      makeEvent({ id: 'evt-2', start_time: '2026-02-15T14:00:00Z', calendar_id: 'cal-2' }),
    ];
    const starredIds = new Set(['evt-2']); // only the second is starred
    const { result } = renderHook(() => useMarkedDates(events, starredIds));

    expect(result.current['2026-02-15']?.starred).toBe(true);
  });

  it('returns not-starred when starredIds is undefined', () => {
    const events = [makeEvent({ id: 'evt-1', start_time: '2026-02-15T10:00:00Z' })];
    const { result } = renderHook(() => useMarkedDates(events));

    expect(result.current['2026-02-15']?.starred).toBe(false);
  });
});
