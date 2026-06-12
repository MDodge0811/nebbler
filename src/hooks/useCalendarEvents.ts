import { useQuery, usePowerSync } from '@powersync/react';
import { useMemo } from 'react';

import type { Event } from '@database/schema';
import { getCalendarColor } from '@utils/calendarColor';
import { allDaySpannedDates } from '@utils/scheduleFeed';

/**
 * Reactive query for events scoped to a specific calendar within a date range.
 * Uses conditional query pattern when calendarId is undefined.
 *
 * @param calendarId Calendar to filter by
 * @param startDate  YYYY-MM-DD — start of the query window
 * @param endDate    YYYY-MM-DD — end of the query window
 */
export function useEvents(calendarId: string | undefined, startDate: string, endDate: string) {
  const startDateTime = `${startDate}T00:00:00Z`;
  const endDateTime = `${endDate}T23:59:59Z`;

  return useQuery<Event>(
    calendarId
      ? `SELECT * FROM events
         WHERE calendar_id = ?
           AND deleted_at IS NULL
           AND start_time <= ?
           AND end_time >= ?
         ORDER BY start_time ASC`
      : 'SELECT * FROM events WHERE 0',
    calendarId ? [calendarId, endDateTime, startDateTime] : []
  );
}

/**
 * Marked-dates shape: per-date calendar colors (up to 3 distinct) and starred flag.
 */
export type MarkedDate = { colors: string[]; starred: boolean };
export type MarkedDates = Record<string, MarkedDate>;

/** Shared empty-dots constant — referential stability keeps day-cell memo() effective. */
export const NO_DOTS: string[] = [];

/**
 * Compute marked-dates object from an event list and a set of starred event ids.
 *
 * - `colors`: up to 3 distinct calendar colors for events on that date,
 *   preferring the synced `calendars.color`, falling back to the
 *   deterministic `getCalendarColor` hash when it is null.
 * - `starred`: true when any event on the date is in the `starredIds` set.
 *
 * Returns a stable empty reference when there are no events.
 */
const EMPTY_MARKED: MarkedDates = {};

const PAD2 = (n: number) => String(n).padStart(2, '0');

/**
 * Returns the YYYY-MM-DD day key for a timed event start using LOCAL date.
 * Timed events near UTC midnight can fall on a different local day than their
 * UTC date — using local avoids the dot landing on the wrong calendar day.
 */
function localDayKeyOf(startTime: string | null): string | null {
  if (!startTime) return null;
  const d = new Date(startTime);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${PAD2(d.getMonth() + 1)}-${PAD2(d.getDate())}`;
}

/**
 * Returns the YYYY-MM-DD day key for an all-day event using UTC date.
 * All-day events store midnight-UTC boundaries, so UTC slicing is correct.
 */
function utcDayKeyOf(startTime: string | null): string | null {
  if (!startTime) return null;
  const key = startTime.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : null;
}

/** Pushes a color into the list, deduped and capped at 3. */
function pushDistinctColor(colors: string[], color: string): void {
  if (colors.length < 3 && !colors.includes(color)) colors.push(color);
}

/**
 * Day keys this event marks on the calendar, clipped to [rangeStart, rangeEnd]:
 *  - all-day → every UTC day it spans (matches the feed's per-day AllDayCards),
 *  - timed   → its single local day.
 * The clip bounds the day-by-day expansion — without it, one malformed
 * far-future end_time would iterate millions of days on the JS thread.
 */
function dayKeysFor(
  event: Event & { calendar_color?: string | null },
  rangeStart: string,
  rangeEnd: string
): string[] {
  const isAllDay = 'is_all_day' in event && event.is_all_day === 1;
  if (isAllDay) {
    const startKey = utcDayKeyOf(event.start_time);
    if (!startKey || !event.start_time) return [];
    const spanned = allDaySpannedDates(
      event.start_time,
      event.end_time ?? event.start_time,
      rangeStart,
      rangeEnd
    );
    return spanned.length > 0 ? spanned : [startKey];
  }
  const key = localDayKeyOf(event.start_time);
  return key ? [key] : [];
}

export function useMarkedDates(
  events: Array<Event & { calendar_color?: string | null }>,
  rangeStart: string,
  rangeEnd: string,
  starredIds?: Set<string>
): MarkedDates {
  return useMemo(() => {
    if (events.length === 0) return EMPTY_MARKED;

    const colorsByDate = new Map<string, string[]>();
    const starredDates = new Set<string>();

    for (const event of events) {
      // Compute the day key(s) this event marks. All-day events are bucketed by
      // UTC date and span EVERY day they cover (matching the feed's per-spanned-day
      // AllDayCards). Timed events bucket by LOCAL date so a midnight-UTC event
      // shows on the right calendar day for the user's timezone.
      const keys = dayKeysFor(event, rangeStart, rangeEnd);
      if (keys.length === 0) continue;

      // Prefer the synced calendar color; fall back to the deterministic hash.
      const color = event.calendar_color ?? getCalendarColor(event.calendar_id ?? '');
      const isStarred = starredIds?.has(event.id) ?? false;

      for (const key of keys) {
        const existing = colorsByDate.get(key);
        if (existing) pushDistinctColor(existing, color);
        else colorsByDate.set(key, [color]);
        if (isStarred) starredDates.add(key);
      }
    }

    const marked: MarkedDates = {};
    for (const [date, colors] of colorsByDate) {
      marked[date] = { colors, starred: starredDates.has(date) };
    }
    return marked;
  }, [events, rangeStart, rangeEnd, starredIds]);
}

/**
 * Reactive query for a single event by id (non-deleted). Returns `null` until
 * loaded or when `eventId` is undefined. Used by the CreateEvent edit flow.
 */
export function useEventById(eventId: string | undefined): Event | null {
  const { data } = useQuery<Event>(
    eventId
      ? 'SELECT * FROM events WHERE id = ? AND deleted_at IS NULL'
      : 'SELECT * FROM events WHERE 0',
    eventId ? [eventId] : []
  );

  return data[0] ?? null;
}

/**
 * CRUD mutations for events.
 */
export function useEventMutations() {
  const powerSync = usePowerSync();

  const createEvent = async (attrs: {
    calendarId: string;
    createdByUserId: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    showAs?: 'busy' | 'free';
    isAllDay?: boolean;
  }) => {
    const now = new Date().toISOString();

    const result = await powerSync.execute(
      `INSERT INTO events
         (id, calendar_id, created_by_user_id, title, description,
          start_time, end_time, show_as, is_all_day, inserted_at, updated_at)
       VALUES (uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [
        attrs.calendarId,
        attrs.createdByUserId,
        attrs.title,
        attrs.description ?? null,
        attrs.startTime,
        attrs.endTime,
        attrs.showAs ?? 'busy',
        attrs.isAllDay ? 1 : 0,
        now,
        now,
      ]
    );

    const row = (result.rows?._array as { id: string }[] | undefined)?.[0];
    return row?.id ?? '';
  };

  const updateEvent = async (id: string, updates: Partial<Omit<Event, 'id'>>) => {
    const setClauses: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.title !== undefined) {
      setClauses.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      setClauses.push('description = ?');
      values.push(updates.description);
    }
    if (updates.start_time !== undefined) {
      setClauses.push('start_time = ?');
      values.push(updates.start_time);
    }
    if (updates.end_time !== undefined) {
      setClauses.push('end_time = ?');
      values.push(updates.end_time);
    }
    if (updates.calendar_id !== undefined) {
      setClauses.push('calendar_id = ?');
      values.push(updates.calendar_id);
    }
    if (updates.show_as !== undefined) {
      setClauses.push('show_as = ?');
      values.push(updates.show_as);
    }
    if (updates.is_all_day !== undefined) {
      setClauses.push('is_all_day = ?');
      values.push(updates.is_all_day);
    }

    if (setClauses.length === 0) return;

    setClauses.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await powerSync.execute(`UPDATE events SET ${setClauses.join(', ')} WHERE id = ?`, values);
  };

  const deleteEvent = async (id: string) => {
    await powerSync.execute('DELETE FROM events WHERE id = ?', [id]);
  };

  return { createEvent, updateEvent, deleteEvent };
}
