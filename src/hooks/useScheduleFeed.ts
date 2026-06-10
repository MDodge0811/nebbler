import { useQuery } from '@powersync/react';
import { useEffect, useMemo, useRef } from 'react';

import { useCalendarGroupMemberships } from '@hooks/useCalendarGroups';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { useEventStars } from '@hooks/useEventStars';
import { reactiveQuery } from '@utils/reactiveQuery';
import type {
  BuildFeedRowsOutput,
  QueryWindow,
  RawFeedEvent,
  ResponseRow,
} from '@utils/scheduleFeed';
import { buildFeedRows, calcStickyWindow } from '@utils/scheduleFeed';

// Re-export types so consumers don't need to import from utils directly
export type { FeedEvent } from '@utils/scheduleFeed';

// ---------------------------------------------------------------------------
// SQL builders — extracted to keep hook functions under complexity limit
// ---------------------------------------------------------------------------

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
  rawEvents: RawFeedEvent[];
  viewModeByCalendar: Record<string, string | null>;
  isLoading: boolean;
  error: Error | undefined;
}

function useCalendarEventsQuery(
  calendarIds: string[],
  userId: string | null | undefined,
  windowStart: string,
  windowEnd: string
): CalendarEventsResult {
  const hasCalendars = calendarIds.length > 0;
  const placeholders = calendarIds.map(() => '?').join(', ');
  const startDateTime = `${windowStart}T00:00:00Z`;
  const endDateTime = `${windowEnd}T23:59:59Z`;

  const [eventSql, eventParams] = reactiveQuery(hasCalendars, buildEventsSql(placeholders), [
    ...calendarIds,
    endDateTime,
    startDateTime,
  ]);
  const {
    data: rawEvents = [],
    isLoading,
    error: eventsError,
  } = useQuery<RawFeedEvent>(eventSql, eventParams);

  const [memberSql, memberParams] = reactiveQuery(
    hasCalendars && !!userId,
    buildMemberSql(placeholders),
    [userId, ...calendarIds]
  );
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

function useEventResponsesByEvent(rawEvents: RawFeedEvent[]): Record<string, ResponseRow[]> {
  // Key on a stable sorted join of the event ids so the response query only
  // re-subscribes when the id *set* changes — not on every PowerSync sync that
  // hands back a fresh rawEvents array ref with identical contents.
  const eventIdsKey = useMemo(
    () => [...new Set(rawEvents.map((e) => e.id))].sort().join(','),
    [rawEvents]
  );
  const eventIds = useMemo(() => (eventIdsKey === '' ? [] : eventIdsKey.split(',')), [eventIdsKey]);

  const hasEvents = eventIds.length > 0;
  const eventPlaceholders = eventIds.map(() => '?').join(', ');
  const [responseSql, responseParams] = reactiveQuery(
    hasEvents,
    buildResponseSql(eventPlaceholders),
    eventIds
  );
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
 *
 * Returns flat FeedRow[] and indexByDate Map for FlashList consumption.
 */
export function useScheduleFeed(
  startDate: string,
  endDate: string,
  today?: string,
  starredOnly = false
) {
  const { user, error: userError } = useCurrentUser();
  const { data: memberships = [], error: membershipsError } = useCalendarGroupMemberships(
    user?.primary_calendar_group_id ?? undefined
  );
  const starredIds = useEventStars();

  const calendarIds = useMemo(
    () => memberships.map((m) => m.calendar_id).filter((id): id is string => id !== null),
    [memberships]
  );

  // Sticky window — computed from the last *committed* window. The ref is
  // written in a commit-phase effect (never mutated during render), so the
  // StrictMode double-invoke of this memo stays deterministic.
  const windowRef = useRef<QueryWindow | null>(null);
  const window = useMemo(() => calcStickyWindow(startDate, windowRef.current), [startDate]);
  useEffect(() => {
    windowRef.current = window;
  }, [window]);

  const {
    rawEvents,
    viewModeByCalendar,
    isLoading: eventsLoading,
    error: eventsError,
  } = useCalendarEventsQuery(calendarIds, user?.id, window.start, window.end);

  const responsesByEvent = useEventResponsesByEvent(rawEvents);

  // Sticky rows — keep the previous output while a new window loads. The ref is
  // committed in an effect (not written during render) for the same reason.
  const previousRowsRef = useRef<BuildFeedRowsOutput | null>(null);
  const feedOutput = useMemo<BuildFeedRowsOutput>(() => {
    if (eventsLoading && previousRowsRef.current) {
      return previousRowsRef.current;
    }
    return buildFeedRows({
      events: rawEvents,
      responsesByEvent,
      starredIds,
      viewModeByCalendar,
      dateRange: { start: startDate, end: endDate },
      today: today ?? startDate,
      now: new Date(),
      starredOnly,
    });
  }, [
    rawEvents,
    responsesByEvent,
    starredIds,
    viewModeByCalendar,
    startDate,
    endDate,
    today,
    eventsLoading,
    starredOnly,
  ]);

  useEffect(() => {
    if (!eventsLoading) {
      previousRowsRef.current = feedOutput;
    }
  }, [feedOutput, eventsLoading]);

  const error = userError ?? membershipsError ?? eventsError ?? undefined;

  return {
    events: rawEvents,
    rows: feedOutput.rows,
    indexByDate: feedOutput.indexByDate,
    viewModeByCalendar,
    responsesByEvent,
    isLoading: eventsLoading,
    error,
  };
}
