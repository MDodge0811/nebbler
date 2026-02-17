import { useMemo } from 'react';
import { useQuery } from '@powersync/react';
import type { Event } from '@database/schema';
import { calendarColors } from '@constants/calendarColors';

/**
 * Reactive query for events overlapping a date range.
 * Returns all non-deleted events whose time span intersects
 * [startDate 00:00 UTC, endDate 23:59:59 UTC].
 * Returns empty results until events are synced from the backend.
 *
 * @param startDate YYYY-MM-DD — start of the query window
 * @param endDate   YYYY-MM-DD — end of the query window
 */
export function useCalendarEvents(startDate: string, endDate: string) {
  const startDateTime = `${startDate}T00:00:00Z`;
  const endDateTime = `${endDate}T23:59:59Z`;

  return useQuery<Event>(
    `SELECT * FROM events
     WHERE deleted_at IS NULL
       AND start_time <= ?
       AND end_time >= ?
     ORDER BY start_time ASC`,
    [endDateTime, startDateTime]
  );
}

/**
 * Compute marked-dates object for react-native-calendars from an event list.
 * Returns `{ 'YYYY-MM-DD': { marked: true, dotColor: '...' } }`.
 */
const EMPTY_MARKED: Record<string, { marked: true; dotColor: string }> = {};

export function useMarkedDates(events: Event[]) {
  return useMemo(() => {
    if (events.length === 0) return EMPTY_MARKED;

    const marked: Record<string, { marked: true; dotColor: string }> = {};

    for (const event of events) {
      if (!event.start_time) continue;
      const d = new Date(event.start_time);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      marked[key] = { marked: true, dotColor: calendarColors.eventDot };
    }

    return marked;
  }, [events]);
}
