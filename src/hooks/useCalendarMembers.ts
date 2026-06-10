import { useQuery, usePowerSync } from '@powersync/react';
import { useMemo } from 'react';

import type { CalendarMember } from '@database/schema';

/**
 * Reactive query for members of a specific calendar.
 * Uses conditional query pattern when calendarId is undefined.
 */
export function useCalendarMembers(calendarId: string | undefined) {
  return useQuery<CalendarMember>(
    calendarId
      ? 'SELECT * FROM calendar_members WHERE calendar_id = ? AND deleted_at IS NULL'
      : 'SELECT * FROM calendar_members WHERE 0',
    calendarId ? [calendarId] : []
  );
}

/**
 * Reactive list of `user_id`s for a calendar's members (NEB-133).
 *
 * Used by the social CreateEvent flow to auto-include all members. Returns only
 * counts/ids — never per-person availability — so privacy is preserved upstream.
 * NEB-166's real heatmap consumes the same member-inclusive userIds.
 */
export function useCalendarMemberUserIds(calendarId: string | undefined): string[] {
  const { data } = useCalendarMembers(calendarId);
  return useMemo(() => {
    const ids = data.map((m) => m.user_id).filter((id): id is string => !!id);
    return Array.from(new Set(ids));
  }, [data]);
}

/**
 * CRUD mutations for calendar members.
 */
export function useCalendarMemberMutations() {
  const powerSync = usePowerSync();

  const addMember = async (
    calendarId: string,
    userId: string,
    roleId: string,
    viewMode?: string
  ) => {
    const now = new Date().toISOString();

    const result = await powerSync.execute(
      `INSERT INTO calendar_members
         (id, calendar_id, user_id, role_id, view_mode, can_delete_events, inserted_at, updated_at)
       VALUES (uuid(), ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [calendarId, userId, roleId, viewMode ?? null, 0, now, now]
    );

    const row = (result.rows?._array as { id: string }[] | undefined)?.[0];
    return row?.id ?? '';
  };

  const updateMember = async (
    id: string,
    updates: Partial<Pick<CalendarMember, 'role_id' | 'view_mode' | 'can_delete_events'>>
  ) => {
    const setClauses: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.role_id !== undefined) {
      setClauses.push('role_id = ?');
      values.push(updates.role_id);
    }
    if (updates.view_mode !== undefined) {
      setClauses.push('view_mode = ?');
      values.push(updates.view_mode);
    }
    if (updates.can_delete_events !== undefined) {
      setClauses.push('can_delete_events = ?');
      values.push(updates.can_delete_events);
    }

    if (setClauses.length === 0) return;

    setClauses.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await powerSync.execute(
      `UPDATE calendar_members SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );
  };

  const removeMember = async (id: string) => {
    await powerSync.execute('DELETE FROM calendar_members WHERE id = ?', [id]);
  };

  return { addMember, updateMember, removeMember };
}
