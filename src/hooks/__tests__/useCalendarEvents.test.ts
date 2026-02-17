import { renderHook } from '@testing-library/react-native';
import { useCalendarEvents, useMarkedDates } from '../useCalendarEvents';
import type { Event } from '@database/schema';

const mockUseQuery = jest.fn().mockReturnValue({ data: [], isLoading: false, error: undefined });

jest.mock('@powersync/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
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
    is_recurring: 0,
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
});

describe('useMarkedDates', () => {
  it('returns empty object when no events', () => {
    const { result } = renderHook(() => useMarkedDates([]));
    expect(result.current).toEqual({});
  });

  it('marks dates that have events', () => {
    const events = [makeEvent({ start_time: '2026-02-15T10:00:00Z' })];
    const { result } = renderHook(() => useMarkedDates(events));

    expect(result.current).toEqual({
      '2026-02-15': { marked: true, dotColor: '#00DB74' },
    });
  });

  it('deduplicates multiple events on the same date', () => {
    const events = [
      makeEvent({ id: 'evt-1', start_time: '2026-02-15T10:00:00Z' }),
      makeEvent({ id: 'evt-2', start_time: '2026-02-15T14:00:00Z' }),
    ];
    const { result } = renderHook(() => useMarkedDates(events));

    expect(Object.keys(result.current)).toHaveLength(1);
    expect(result.current['2026-02-15']).toEqual({ marked: true, dotColor: '#00DB74' });
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
});
