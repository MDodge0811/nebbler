import { useQuery } from '@powersync/react';
import { useMemo, useRef } from 'react';

import type { Event } from '@database/schema';
import { useCalendarGroupMemberships } from '@hooks/useCalendarGroups';
import { useCurrentUser } from '@hooks/useCurrentUser';
import type { FeedEvent, ResponseRow, BuildFeedRowsOutput, QueryWindow } from '@utils/scheduleFeed';
import { buildFeedRows, calcStickyWindow } from '@utils/scheduleFeed';

// Re-export legacy types so existing consumers don't break
export type { FeedEvent } from '@utils/scheduleFeed';

export interface EmptySentinel {
  _empty: true;
  id: string;
}

export interface DateSection {
  title: string; // YYYY-MM-DD
  data: (FeedEvent | EmptySentinel)[];
  eventCount: number;
}

export function isEmptySentinel(item: FeedEvent | EmptySentinel): item is EmptySentinel {
  return '_empty' in item;
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
 * Groups events into DateSection[] for SectionList consumption (legacy path).
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
    const count = dayEvents?.length ?? 0;
    return {
      title: date,
      data: count > 0 && dayEvents ? dayEvents : [{ _empty: true, id: `empty-${date}` }],
      eventCount: count,
    };
  });
}

// ---------------------------------------------------------------------------
// SQL builders — extracted to keep hook functions under complexity limit
// ---------------------------------------------------------------------------

const EMPTY_CALENDAR_EVENTS_SQL = `SELECT e.*,
         c.name AS calendar_name, c.type AS calendar_type,
         c.color AS calendar_color,
         c.default_view_mode AS calendar_default_view_mode
  FROM events e JOIN calendars c ON 0 WHERE 0`;

function buildEventsSql(placeholders: string): string {
  return `SELECT e.*,
              c.name AS calendar_name,
              c.type AS calendar_type,
              c.color AS calendar_color,
              c.default_view_mode AS calendar_default_view_mode
       FROM events e
       JOIN calendars c ON e.calendar_id = c.id
       WHERE e.calendar_id IN (${placeholders})
         AND e.deleted_at IS NULL
         AND e.start_time <= ?
         AND e.end_time >= ?
       ORDER BY e.start_time ASC`;
}

function buildMemberSql(placeholders: string): string {
  return `SELECT cm.calendar_id, cm.view_mode
       FROM calendar_members cm
       WHERE cm.user_id = ?
         AND cm.calendar_id IN (${placeholders})
         AND cm.deleted_at IS NULL`;
}

const EMPTY_MEMBER_SQL = 'SELECT calendar_id, view_mode FROM calendar_members WHERE 0';

const EMPTY_RESPONSE_SQL =
  'SELECT er.event_id, er.user_id, er.status, u.first_name, u.last_name, u.avatar_color FROM event_responses er JOIN users u ON 0 WHERE 0';

function buildResponseSql(eventPlaceholders: string): string {
  return `SELECT er.event_id, er.user_id, er.status,
              u.first_name, u.last_name, u.avatar_color
       FROM event_responses er
       JOIN users u ON er.user_id = u.id
       WHERE er.event_id IN (${eventPlaceholders})
         AND er.deleted_at IS NULL`;
}

// ---------------------------------------------------------------------------
// Response row type
// ---------------------------------------------------------------------------

interface ResponseJoinRow {
  event_id: string;
  user_id: string;
  status: string;
  first_name: string | null;
  last_name: string | null;
  avatar_color: string | null;
}

// ---------------------------------------------------------------------------
// Sub-hook: calendar events + member view modes
// ---------------------------------------------------------------------------

interface CalendarEventsResult {
  rawEvents: FeedEvent[];
  viewModeByCalendar: Record<string, string | null>;
  isLoading: boolean;
  error: Error | undefined;
}

function useCalendarEvents(
  calendarIds: string[],
  userId: string | null | undefined,
  windowStart: string,
  windowEnd: string
): CalendarEventsResult {
  const hasCalendars = calendarIds.length > 0;
  const placeholders = calendarIds.map(() => '?').join(', ');
  const startDateTime = `${windowStart}T00:00:00Z`;
  const endDateTime = `${windowEnd}T23:59:59Z`;

  const eventSql = hasCalendars ? buildEventsSql(placeholders) : EMPTY_CALENDAR_EVENTS_SQL;
  const eventParams = hasCalendars ? [...calendarIds, endDateTime, startDateTime] : [];

  const {
    data: rawEvents = [],
    isLoading,
    error: eventsError,
  } = useQuery<FeedEvent>(eventSql, eventParams);

  const memberSql = hasCalendars && userId ? buildMemberSql(placeholders) : EMPTY_MEMBER_SQL;
  const memberParams = hasCalendars && userId ? [userId, ...calendarIds] : [];

  const { data: memberRows = [], error: memberError } = useQuery<{
    calendar_id: string;
    view_mode: string | null;
  }>(memberSql, memberParams);

  const viewModeByCalendar = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const row of memberRows) {
      map[row.calendar_id] = row.view_mode;
    }
    return map;
  }, [memberRows]);

  const error = eventsError ?? memberError ?? undefined;
  return { rawEvents, viewModeByCalendar, isLoading, error };
}

// ---------------------------------------------------------------------------
// Sub-hook: event responses
// ---------------------------------------------------------------------------

function useEventResponsesByEvent(rawEvents: FeedEvent[]): Record<string, ResponseRow[]> {
  const eventIds = useMemo(() => rawEvents.map((e) => (e as Event).id), [rawEvents]);
  const hasEvents = eventIds.length > 0;
  const eventPlaceholders = eventIds.map(() => '?').join(', ');
  const responseSql = hasEvents ? buildResponseSql(eventPlaceholders) : EMPTY_RESPONSE_SQL;
  const responseParams = hasEvents ? eventIds : [];

  const { data: responseRows = [] } = useQuery<ResponseJoinRow>(responseSql, responseParams);

  return useMemo(() => {
    const map: Record<string, ResponseRow[]> = {};
    for (const row of responseRows) {
      const arr = map[row.event_id] ?? [];
      arr.push(row);
      map[row.event_id] = arr;
    }
    return map;
  }, [responseRows]);
}

// ---------------------------------------------------------------------------
// Main hook
// ---------------------------------------------------------------------------

/**
 * Multi-stage reactive query that fetches events from all calendars
 * in the user's primary calendar group, joined with calendar metadata.
 *
 * Stage 1: useCalendarGroupMemberships → calendar IDs
 * Stage 2: events JOIN calendars (with calendar_color, calendar_default_view_mode)
 * Stage 3: calendar_members for current user (view_mode resolution)
 * Stage 4: event_responses JOIN users (attendee chips)
 *
 * Sticky window: re-centers only when selectedDate comes within 7 days of
 * either window edge. Previous rows are retained while a new window loads.
 */
export function useScheduleFeed(startDate: string, endDate: string, displayStartDate?: string) {
  const { user, error: userError } = useCurrentUser();
  const { data: memberships = [], error: membershipsError } = useCalendarGroupMemberships(
    user?.primary_calendar_group_id ?? undefined
  );

  const calendarIds = useMemo(
    () => memberships.map((m) => m.calendar_id).filter((id): id is string => id !== null),
    [memberships]
  );

  // Sticky window — only re-center when near the edge
  const windowRef = useRef<QueryWindow | null>(null);
  const window = useMemo(() => {
    const next = calcStickyWindow(startDate, windowRef.current);
    windowRef.current = next;
    return next;
  }, [startDate]);

  const {
    rawEvents,
    viewModeByCalendar,
    isLoading: eventsLoading,
    error: eventsError,
  } = useCalendarEvents(calendarIds, user?.id, window.start, window.end);

  const responsesByEvent = useEventResponsesByEvent(rawEvents);

  // Sticky rows — keep previous rows while a new window is loading
  const previousRowsRef = useRef<BuildFeedRowsOutput | null>(null);

  // Legacy SectionList path (kept for ScheduleScreen until S4 cutover)
  const sections = useMemo(
    () => buildSections(rawEvents, startDate, endDate, displayStartDate),
    [rawEvents, startDate, endDate, displayStartDate]
  );

  // New FeedRow path (S3/S4 consumers)
  const feedOutput = useMemo<BuildFeedRowsOutput>(() => {
    if (eventsLoading && previousRowsRef.current) {
      return previousRowsRef.current;
    }
    const output = buildFeedRows({
      events: rawEvents,
      responsesByEvent,
      starredIds: new Set<string>(), // useEventStars called by consumer; pass empty here
      viewModeByCalendar,
      dateRange: { start: startDate, end: endDate },
      today: startDate, // caller passes today explicitly in S4; use startDate as fallback
      now: new Date(),
      starredOnly: false,
    });
    previousRowsRef.current = output;
    return output;
  }, [rawEvents, responsesByEvent, viewModeByCalendar, startDate, endDate, eventsLoading]);

  const error = userError ?? membershipsError ?? eventsError ?? undefined;

  return {
    // Legacy SectionList output (ScheduleScreen, EventFeed)
    sections,
    events: rawEvents,
    // New FeedRow output (S3/S4 consumers)
    rows: feedOutput.rows,
    indexByDate: feedOutput.indexByDate,
    viewModeByCalendar,
    responsesByEvent,
    isLoading: eventsLoading,
    error,
  };
}
