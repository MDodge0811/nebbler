import { useMemo } from 'react';
import { useQuery } from '@powersync/react';
import type { Event } from '@database/schema';
import { calendarColors } from '@constants/calendarColors';

/**
 * Reactive query for events within a date range.
 * Returns empty results until events are synced from the backend.
 *
 * @param startDate ISO date string (YYYY-MM-DD) — inclusive
 * @param endDate   ISO date string (YYYY-MM-DD) — inclusive
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
export function useMarkedDates(events: Event[]) {
  return useMemo(() => {
    const marked: Record<string, { marked: true; dotColor: string }> = {};

    for (const event of events) {
      const dateMatch = event.start_time?.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        marked[dateMatch[1]] = { marked: true, dotColor: calendarColors.eventDot };
      }
    }

    return marked;
  }, [events]);
}
