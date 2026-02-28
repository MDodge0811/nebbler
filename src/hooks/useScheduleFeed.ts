import { useMemo } from 'react';
import { useQuery } from '@powersync/react';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { useCalendarGroupMemberships } from '@hooks/useCalendarGroups';
import type { Event } from '@database/schema';

export interface FeedEvent extends Event {
  calendar_name: string;
  calendar_type: string;
}

export interface EmptySentinel {
  _empty: true;
  id: string;
}

export interface DateSection {
  title: string; // YYYY-MM-DD
  data: (FeedEvent | EmptySentinel)[];
}

export function isEmptySentinel(item: FeedEvent | EmptySentinel): item is EmptySentinel {
  return '_empty' in item && item._empty === true;
}

/**
 * Generates an array of YYYY-MM-DD strings from startDate to endDate inclusive.
 */
function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');

  while (current <= end) {
    const pad = (n: number) => String(n).padStart(2, '0');
    dates.push(`${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Groups events into DateSection[] for SectionList consumption.
 * Every date in the range gets a section — empty days include a sentinel item.
 */
export function buildSections(
  events: FeedEvent[],
  startDate: string,
  endDate: string,
  displayStartDate?: string
): DateSection[] {
  if (displayStartDate && displayStartDate > startDate) {
    startDate = displayStartDate;
  }
  const dateRange = getDateRange(startDate, endDate);

  const eventsByDate = new Map<string, FeedEvent[]>();
  for (const event of events) {
    if (!event.start_time) continue;
    // Convert UTC to local date for correct day bucketing
    const localDate = new Date(event.start_time);
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateKey = `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())}`;
    const existing = eventsByDate.get(dateKey);
    if (existing) {
      existing.push(event);
    } else {
      eventsByDate.set(dateKey, [event]);
    }
  }

  return dateRange.map((date) => {
    const dayEvents = eventsByDate.get(date);
    return {
      title: date,
      data: dayEvents && dayEvents.length > 0 ? dayEvents : [{ _empty: true, id: `empty-${date}` }],
    };
  });
}

/**
 * Two-stage reactive query that fetches events from all calendars
 * in the user's primary calendar group, joined with calendar metadata.
 *
 * Stage 1: useCalendarGroupMemberships → calendar IDs
 * Stage 2: useQuery with dynamic WHERE calendar_id IN (...) → events JOIN calendars
 */
export function useScheduleFeed(startDate: string, endDate: string, displayStartDate?: string) {
  const { user, error: userError } = useCurrentUser();
  const primaryGroupId = user?.primary_calendar_group_id;

  // Stage 1: get calendar IDs in the primary group
  const { data: memberships = [], error: membershipsError } = useCalendarGroupMemberships(
    primaryGroupId ?? undefined
  );

  const calendarIds = useMemo(() => memberships.map((m) => m.calendar_id), [memberships]);

  // Stage 2: query events joined with calendars
  const hasCalendars = calendarIds.length > 0;
  const placeholders = calendarIds.map(() => '?').join(', ');
  const startDateTime = `${startDate}T00:00:00Z`;
  const endDateTime = `${endDate}T23:59:59Z`;

  // Range-overlap query: an event overlaps the visible window when
  // event.start_time <= window.end AND event.end_time >= window.start.
  const sql = hasCalendars
    ? `SELECT e.*, c.name AS calendar_name, c.type AS calendar_type
       FROM events e
       JOIN calendars c ON e.calendar_id = c.id
       WHERE e.calendar_id IN (${placeholders})
         AND e.deleted_at IS NULL
         AND e.start_time <= ?
         AND e.end_time >= ?
       ORDER BY e.start_time ASC`
    : 'SELECT e.*, c.name AS calendar_name, c.type AS calendar_type FROM events e JOIN calendars c ON 0 WHERE 0';

  const params = hasCalendars ? [...calendarIds, endDateTime, startDateTime] : [];

  const { data: events = [], isLoading, error } = useQuery<FeedEvent>(sql, params);

  const sections = useMemo(
    () => buildSections(events, startDate, endDate, displayStartDate),
    [events, startDate, endDate, displayStartDate]
  );

  return { sections, events, isLoading, error: userError ?? membershipsError ?? error };
}
