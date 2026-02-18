import { useQuery, usePowerSync } from '@powersync/react';
import type { Calendar, CalendarMember } from '@database/schema';
import { generateUUID } from '@utils/uuid';

/**
 * Reactive query for all non-deleted calendars, ordered by name.
 * Sync rules already scope results to calendars the user has membership in.
 */
export function useCalendars() {
  return useQuery<Calendar>('SELECT * FROM calendars WHERE deleted_at IS NULL ORDER BY name ASC');
}

/**
 * Reactive query for a single calendar by ID.
 * Uses conditional query pattern — returns empty results when id is undefined.
 */
export function useCalendar(id: string | undefined) {
  return useQuery<Calendar>(
    id ? 'SELECT * FROM calendars WHERE id = ?' : 'SELECT * FROM calendars WHERE 0',
    id ? [id] : []
  );
}

/**
 * CRUD mutations for calendars.
 *
 * createCalendar uses a write transaction to insert both the calendar and the
 * owner's calendar_members row atomically — without the membership row, sync
 * rules won't replicate the calendar back to the client.
 */
export function useCalendarMutations() {
  const powerSync = usePowerSync();

  const createCalendar = async (
    attrs: { ownerId: string; type: string; name: string; description?: string },
    ownerRoleId: string
  ) => {
    const calendarId = generateUUID();
    const memberId = generateUUID();
    const now = new Date().toISOString();

    // Type-based defaults matching backend logic (calendar.ex)
    const rsvpEnabled = attrs.type === 'private' ? 0 : 1;
    const discoverable = attrs.type === 'public' ? 1 : 0;
    const defaultViewMode = 'full';
    const householdSharing = 1;

    await powerSync.writeTransaction(async (tx) => {
      await tx.execute(
        `INSERT INTO calendars
           (id, owner_id, type, name, description, rsvp_enabled, discoverable,
            default_view_mode, household_sharing, inserted_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          calendarId,
          attrs.ownerId,
          attrs.type,
          attrs.name,
          attrs.description ?? null,
          rsvpEnabled,
          discoverable,
          defaultViewMode,
          householdSharing,
          now,
          now,
        ]
      );

      await tx.execute(
        `INSERT INTO calendar_members
           (id, calendar_id, user_id, role_id, can_delete_events, inserted_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [memberId, calendarId, attrs.ownerId, ownerRoleId, 1, now, now]
      );
    });

    return calendarId;
  };

  const updateCalendar = async (id: string, updates: Partial<Omit<Calendar, 'id'>>) => {
    const setClauses: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.name !== undefined) {
      setClauses.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClauses.push('description = ?');
      values.push(updates.description);
    }
    if (updates.rsvp_enabled !== undefined) {
      setClauses.push('rsvp_enabled = ?');
      values.push(updates.rsvp_enabled);
    }
    if (updates.discoverable !== undefined) {
      setClauses.push('discoverable = ?');
      values.push(updates.discoverable);
    }
    if (updates.default_view_mode !== undefined) {
      setClauses.push('default_view_mode = ?');
      values.push(updates.default_view_mode);
    }
    if (updates.household_sharing !== undefined) {
      setClauses.push('household_sharing = ?');
      values.push(updates.household_sharing);
    }

    if (setClauses.length === 0) return;

    setClauses.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await powerSync.execute(`UPDATE calendars SET ${setClauses.join(', ')} WHERE id = ?`, values);
  };

  const deleteCalendar = async (id: string) => {
    await powerSync.execute('DELETE FROM calendars WHERE id = ?', [id]);
  };

  return { createCalendar, updateCalendar, deleteCalendar };
}

// Re-export CalendarMember type for consumers that need it alongside calendar hooks
export type { Calendar, CalendarMember };
