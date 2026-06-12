import { renderHook } from '@testing-library/react-native';

import type { Event } from '@database/schema';

import { useMarkedDates } from '../useCalendarEvents';

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

// Query range the hook clips marked days to (mirrors the screen's month buffer).
const RANGE_START = '2026-01-01';
const RANGE_END = '2026-12-31';

describe('useMarkedDates', () => {
  it('returns a stable empty object reference when no events', () => {
    const { result, rerender } = renderHook(() => useMarkedDates([], RANGE_START, RANGE_END));
    const first = result.current;
    rerender(undefined);
    expect(result.current).toBe(first);
  });

  it('marks dates that have events with calendar color and not starred', () => {
    const events = [makeEvent({ start_time: '2026-02-15T10:00:00Z', calendar_id: 'cal-1' })];
    const { result } = renderHook(() => useMarkedDates(events, RANGE_START, RANGE_END));

    expect(result.current['2026-02-15']).toBeDefined();
    expect(result.current['2026-02-15']?.colors).toHaveLength(1);
    expect(result.current['2026-02-15']?.starred).toBe(false);
  });

  it('deduplicates same-calendar events on the same date (one color entry)', () => {
    const events = [
      makeEvent({ id: 'evt-1', start_time: '2026-02-15T10:00:00Z', calendar_id: 'cal-1' }),
      makeEvent({ id: 'evt-2', start_time: '2026-02-15T14:00:00Z', calendar_id: 'cal-1' }),
    ];
    const { result } = renderHook(() => useMarkedDates(events, RANGE_START, RANGE_END));

    expect(Object.keys(result.current)).toHaveLength(1);
    // Same calendar → same color → deduplicated to 1 color
    expect(result.current['2026-02-15']?.colors).toHaveLength(1);
  });

  it('prefers the synced calendar_color over the hash fallback', () => {
    const events = [makeEvent({ calendar_color: '#FF6B6B' } as Partial<Event>)];
    const { result } = renderHook(() => useMarkedDates(events, RANGE_START, RANGE_END));
    expect(result.current['2026-02-15']?.colors).toEqual(['#FF6B6B']);
  });

  it('collects distinct calendar colors on the same date (up to 3)', () => {
    const events = [
      makeEvent({ id: 'evt-1', start_time: '2026-02-15T10:00:00Z', calendar_id: 'cal-a' }),
      makeEvent({ id: 'evt-2', start_time: '2026-02-15T12:00:00Z', calendar_id: 'cal-b' }),
      makeEvent({ id: 'evt-3', start_time: '2026-02-15T14:00:00Z', calendar_id: 'cal-c' }),
      makeEvent({ id: 'evt-4', start_time: '2026-02-15T16:00:00Z', calendar_id: 'cal-d' }),
    ];
    const { result } = renderHook(() => useMarkedDates(events, RANGE_START, RANGE_END));

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
    const { result } = renderHook(() => useMarkedDates(events, RANGE_START, RANGE_END));

    expect(Object.keys(result.current)).toHaveLength(2);
    expect(result.current['2026-02-10']).toBeDefined();
    expect(result.current['2026-02-20']).toBeDefined();
  });

  it('skips events with null start_time', () => {
    const events = [makeEvent({ start_time: null as unknown as string })];
    const { result } = renderHook(() => useMarkedDates(events, RANGE_START, RANGE_END));
    expect(result.current).toEqual({});
  });

  it('skips events with invalid start_time', () => {
    const events = [makeEvent({ start_time: 'not-a-date' })];
    const { result } = renderHook(() => useMarkedDates(events, RANGE_START, RANGE_END));
    expect(result.current).toEqual({});
  });

  it('marks date as starred when event id is in starredIds set', () => {
    const events = [makeEvent({ id: 'evt-1', start_time: '2026-02-15T10:00:00Z' })];
    const starredIds = new Set(['evt-1']);
    const { result } = renderHook(() => useMarkedDates(events, RANGE_START, RANGE_END, starredIds));

    expect(result.current['2026-02-15']?.starred).toBe(true);
  });

  it('does not mark date as starred when no event on it is in starredIds', () => {
    const events = [makeEvent({ id: 'evt-1', start_time: '2026-02-15T10:00:00Z' })];
    const starredIds = new Set(['evt-999']);
    const { result } = renderHook(() => useMarkedDates(events, RANGE_START, RANGE_END, starredIds));

    expect(result.current['2026-02-15']?.starred).toBe(false);
  });

  it('marks date starred when at least one event on it is starred', () => {
    const events = [
      makeEvent({ id: 'evt-1', start_time: '2026-02-15T10:00:00Z', calendar_id: 'cal-1' }),
      makeEvent({ id: 'evt-2', start_time: '2026-02-15T14:00:00Z', calendar_id: 'cal-2' }),
    ];
    const starredIds = new Set(['evt-2']); // only the second is starred
    const { result } = renderHook(() => useMarkedDates(events, RANGE_START, RANGE_END, starredIds));

    expect(result.current['2026-02-15']?.starred).toBe(true);
  });

  it('returns not-starred when starredIds is undefined', () => {
    const events = [makeEvent({ id: 'evt-1', start_time: '2026-02-15T10:00:00Z' })];
    const { result } = renderHook(() => useMarkedDates(events, RANGE_START, RANGE_END));

    expect(result.current['2026-02-15']?.starred).toBe(false);
  });

  it('buckets timed events by LOCAL date (not UTC slice)', () => {
    // A timed event at 10:00 UTC on Feb 15 — the local date depends on timezone,
    // but we just verify the key equals new Date(startTime) local date components,
    // not the literal UTC string slice.
    const startTime = '2026-02-15T10:00:00Z';
    const d = new Date(startTime);
    const expectedKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const events = [makeEvent({ id: 'evt-local', start_time: startTime, is_all_day: 0 })];
    const { result } = renderHook(() => useMarkedDates(events, RANGE_START, RANGE_END));

    expect(result.current[expectedKey]).toBeDefined();
  });

  it('buckets all-day events by UTC date', () => {
    // All-day events use midnight-UTC start; UTC date slice must be used.
    const events = [
      makeEvent({
        id: 'evt-allday',
        start_time: '2026-02-15T00:00:00Z',
        end_time: '2026-02-16T00:00:00Z',
        is_all_day: 1,
      }),
    ];
    const { result } = renderHook(() => useMarkedDates(events, RANGE_START, RANGE_END));

    // The UTC date is 2026-02-15 regardless of timezone
    expect(result.current['2026-02-15']).toBeDefined();
  });

  it('marks EVERY spanned day of a multi-day all-day event (matches the feed)', () => {
    // Fri–Sun trip: end is exclusive midnight, so it spans Feb 13, 14, 15.
    const events = [
      makeEvent({
        id: 'trip',
        start_time: '2026-02-13T00:00:00Z',
        end_time: '2026-02-16T00:00:00Z',
        is_all_day: 1,
      }),
    ];
    const { result } = renderHook(() => useMarkedDates(events, RANGE_START, RANGE_END));

    expect(result.current['2026-02-13']).toBeDefined();
    expect(result.current['2026-02-14']).toBeDefined();
    expect(result.current['2026-02-15']).toBeDefined();
    // End is exclusive — the trip does not cover Feb 16.
    expect(result.current['2026-02-16']).toBeUndefined();
  });

  it('clips all-day spans to the query range (a malformed far-future end_time stays bounded)', () => {
    const events = [
      makeEvent({
        id: 'runaway',
        start_time: '2026-02-13T00:00:00Z',
        end_time: '9999-01-01T00:00:00Z', // corrupt row — must not expand day-by-day to year 9999
        is_all_day: 1,
      }),
    ];
    const { result } = renderHook(() => useMarkedDates(events, RANGE_START, '2026-02-14'));

    expect(result.current['2026-02-13']).toBeDefined();
    expect(result.current['2026-02-14']).toBeDefined();
    // Clipped at the range end — nothing marked beyond it.
    expect(result.current['2026-02-15']).toBeUndefined();
    expect(Object.keys(result.current)).toHaveLength(2);
  });
});
