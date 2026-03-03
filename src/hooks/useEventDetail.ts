import { useMemo } from 'react';
import { useQuery } from '@powersync/react';
import { useCurrentUser } from '@hooks/useCurrentUser';
import type { Event, Calendar, User } from '@database/schema';

interface MembershipRow {
  id: string;
  calendar_id: string;
  user_id: string;
  role_id: string;
  view_mode: string | null;
  can_delete_events: number;
  role_level: number;
  role_name: string;
}

export interface EventPermissions {
  canEdit: boolean;
  canDelete: boolean;
  isFreeBusy: boolean;
}

/**
 * Composite hook for the Event Detail screen.
 * Returns the event, its calendar, creator, current user's membership, and computed permissions.
 */
export function useEventDetail(eventId: string | undefined) {
  const { authUser } = useCurrentUser();
  const userId = authUser?.id;

  // 1. Event by ID
  const { data: events = [] } = useQuery<Event>(
    eventId
      ? 'SELECT * FROM events WHERE id = ? AND deleted_at IS NULL'
      : 'SELECT * FROM events WHERE 0',
    eventId ? [eventId] : []
  );
  const event = events[0] ?? null;

  // 2. Calendar by event.calendar_id
  const calendarId = event?.calendar_id;
  const { data: calendars = [] } = useQuery<Calendar>(
    calendarId ? 'SELECT * FROM calendars WHERE id = ?' : 'SELECT * FROM calendars WHERE 0',
    calendarId ? [calendarId] : []
  );
  const calendar = calendars[0] ?? null;

  // 3. Creator user
  const creatorId = event?.created_by_user_id;
  const { data: creators = [] } = useQuery<User>(
    creatorId ? 'SELECT * FROM users WHERE id = ?' : 'SELECT * FROM users WHERE 0',
    creatorId ? [creatorId] : []
  );
  const creator = creators[0] ?? null;

  // 4. Current user's membership + role level for this calendar
  const { data: memberships = [] } = useQuery<MembershipRow>(
    calendarId && userId
      ? `SELECT cm.*, r.level AS role_level, r.name AS role_name
         FROM calendar_members cm
         JOIN roles r ON cm.role_id = r.id
         WHERE cm.calendar_id = ? AND cm.user_id = ? AND cm.deleted_at IS NULL`
      : 'SELECT * FROM calendar_members WHERE 0',
    calendarId && userId ? [calendarId, userId] : []
  );
  const membership = memberships[0] ?? null;

  // 5. Computed permissions
  const permissions = useMemo<EventPermissions>(() => {
    if (!event || !userId) {
      return { canEdit: false, canDelete: false, isFreeBusy: false };
    }

    const isCreator = event.created_by_user_id === userId;
    const roleLevel = membership?.role_level ?? 0;

    const canEdit = isCreator || roleLevel >= 20;
    const canDelete =
      isCreator || (roleLevel >= 20 && membership?.can_delete_events === 1) || roleLevel >= 30;
    const isFreeBusy = membership?.view_mode === 'free_busy';

    return { canEdit, canDelete, isFreeBusy };
  }, [event, userId, membership]);

  return { event, calendar, creator, membership, permissions };
}
