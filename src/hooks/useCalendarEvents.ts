import { useMemo } from 'react';
import { useQuery, usePowerSync } from '@powersync/react';
import type { Event } from '@database/schema';
import { calendarColors } from '@constants/calendarColors';
import { generateUUID } from '@utils/uuid';

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
      const key = event.start_time.slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
      marked[key] = { marked: true, dotColor: calendarColors.eventDot };
    }

    return marked;
  }, [events]);
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
  }) => {
    const id = generateUUID();
    const now = new Date().toISOString();

    await powerSync.execute(
      `INSERT INTO events
         (id, calendar_id, created_by_user_id, title, description,
          start_time, end_time, is_recurring, inserted_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        attrs.calendarId,
        attrs.createdByUserId,
        attrs.title,
        attrs.description ?? null,
        attrs.startTime,
        attrs.endTime,
        0, // is_recurring — always 0 for MVP
        now,
        now,
      ]
    );

    return id;
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
