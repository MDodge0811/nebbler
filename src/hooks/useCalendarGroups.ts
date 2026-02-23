import { useQuery, usePowerSync } from '@powersync/react';
import type { CalendarGroup, CalendarGroupMembership, CalendarGroupUser } from '@database/schema';

/**
 * Reactive query for all calendar groups.
 * Sync rules already scope results to groups the user belongs to.
 */
export function useCalendarGroups() {
  return useQuery<CalendarGroup>(
    'SELECT * FROM calendar_groups WHERE deleted_at IS NULL ORDER BY name ASC'
  );
}

/**
 * Reactive query for a single calendar group by ID.
 * Uses conditional query pattern when id is undefined.
 */
export function useCalendarGroup(id: string | undefined) {
  return useQuery<CalendarGroup>(
    id ? 'SELECT * FROM calendar_groups WHERE id = ?' : 'SELECT * FROM calendar_groups WHERE 0',
    id ? [id] : []
  );
}

/**
 * Reactive query for calendars belonging to a group (via calendar_group_memberships).
 * Uses conditional query pattern when groupId is undefined.
 */
export function useCalendarGroupMemberships(groupId: string | undefined) {
  return useQuery<CalendarGroupMembership>(
    groupId
      ? 'SELECT * FROM calendar_group_memberships WHERE calendar_group_id = ? AND deleted_at IS NULL'
      : 'SELECT * FROM calendar_group_memberships WHERE 0',
    groupId ? [groupId] : []
  );
}

/**
 * CRUD mutations for calendar groups.
 *
 * createGroup uses a write transaction to insert both the group and the
 * owner's calendar_group_users row atomically — without the group-user row,
 * sync rules won't replicate the group back to the client.
 */
export function useCalendarGroupMutations() {
  const powerSync = usePowerSync();

  const createGroup = async (ownerId: string, name: string, type?: string) => {
    const now = new Date().toISOString();

    const groupId = await powerSync.writeTransaction(async (tx) => {
      const result = await tx.execute(
        `INSERT INTO calendar_groups
           (id, owner_id, name, type, inserted_at, updated_at)
         VALUES (uuid(), ?, ?, ?, ?, ?) RETURNING id`,
        [ownerId, name, type ?? 'personal', now, now]
      );
      const id = result.rows?._array[0]?.id as string;

      await tx.execute(
        `INSERT INTO calendar_group_users
           (id, calendar_group_id, user_id, role, inserted_at, updated_at)
         VALUES (uuid(), ?, ?, ?, ?, ?)`,
        [id, ownerId, 'owner', now, now]
      );

      return id;
    });

    return groupId;
  };

  const updateGroup = async (id: string, updates: { name: string }) => {
    const now = new Date().toISOString();

    await powerSync.execute('UPDATE calendar_groups SET name = ?, updated_at = ? WHERE id = ?', [
      updates.name,
      now,
      id,
    ]);
  };

  const deleteGroup = async (id: string) => {
    await powerSync.execute('DELETE FROM calendar_groups WHERE id = ?', [id]);
  };

  const addCalendarToGroup = async (groupId: string, calendarId: string, viewMode?: string) => {
    const now = new Date().toISOString();

    const result = await powerSync.execute(
      `INSERT INTO calendar_group_memberships
         (id, calendar_group_id, calendar_id, view_mode, inserted_at, updated_at)
       VALUES (uuid(), ?, ?, ?, ?, ?) RETURNING id`,
      [groupId, calendarId, viewMode ?? null, now, now]
    );

    return result.rows?._array[0]?.id as string;
  };

  const removeCalendarFromGroup = async (id: string) => {
    await powerSync.execute('DELETE FROM calendar_group_memberships WHERE id = ?', [id]);
  };

  return {
    createGroup,
    updateGroup,
    deleteGroup,
    addCalendarToGroup,
    removeCalendarFromGroup,
  };
}

// Re-export types for consumers
export type { CalendarGroup, CalendarGroupUser, CalendarGroupMembership };
