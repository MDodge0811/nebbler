import { useQuery } from '@powersync/react';
import { useMemo } from 'react';

import type { Event, Calendar, User } from '@database/schema';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { firstRow, reactiveQuery } from '@utils/reactiveQuery';

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
  const [eventSql, eventParams] = reactiveQuery(
    !!eventId,
    'SELECT * FROM events WHERE id = ? AND deleted_at IS NULL',
    [eventId]
  );
  const { data: events = [] } = useQuery<Event>(eventSql, eventParams);
  const event = firstRow(events);

  // 2. Calendar by event.calendar_id
  const calendarId = event?.calendar_id;
  const [calSql, calParams] = reactiveQuery(!!calendarId, 'SELECT * FROM calendars WHERE id = ?', [
    calendarId,
  ]);
  const { data: calendars = [] } = useQuery<Calendar>(calSql, calParams);
  const calendar = firstRow(calendars);

  // 3. Creator user
  const creatorId = event?.created_by_user_id;
  const [creatorSql, creatorParams] = reactiveQuery(
    !!creatorId,
    'SELECT * FROM users WHERE id = ?',
    [creatorId]
  );
  const { data: creators = [] } = useQuery<User>(creatorSql, creatorParams);
  const creator = firstRow(creators);

  // 4. Current user's membership + role level for this calendar
  const [memSql, memParams] = reactiveQuery(
    !!(calendarId && userId),
    `SELECT cm.*, r.level AS role_level, r.name AS role_name
         FROM calendar_members cm
         JOIN roles r ON cm.role_id = r.id
         WHERE cm.calendar_id = ? AND cm.user_id = ? AND cm.deleted_at IS NULL`,
    [calendarId, userId]
  );
  const { data: memberships = [] } = useQuery<MembershipRow>(memSql, memParams);
  const membership = firstRow(memberships);

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
