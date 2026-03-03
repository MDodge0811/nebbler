import { useQuery } from '@powersync/react';
import type { Calendar } from '@database/schema';

export interface WritableCalendar extends Calendar {
  role_level: number;
}

/**
 * Reactive query for calendars where the user has role level >= 20 (manager+).
 * Returns calendars the user can create/edit events in.
 */
export function useWritableCalendars(userId: string | undefined) {
  return useQuery<WritableCalendar>(
    userId
      ? `SELECT c.*, r.level AS role_level
         FROM calendars c
         JOIN calendar_members cm ON c.id = cm.calendar_id
         JOIN roles r ON cm.role_id = r.id
         WHERE cm.user_id = ?
           AND cm.deleted_at IS NULL
           AND c.deleted_at IS NULL
           AND r.level >= 20
         ORDER BY c.name ASC`
      : 'SELECT * FROM calendars WHERE 0',
    userId ? [userId] : []
  );
}
