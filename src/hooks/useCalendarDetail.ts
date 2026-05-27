import { useMemo } from 'react';
import { useQuery } from '@powersync/react';
import { useCurrentUser } from '@hooks/useCurrentUser';
import type { Calendar, Event, User } from '@database/schema';

interface MembershipJoinRow {
  id: string;
  calendar_id: string;
  user_id: string;
  role_id: string;
  view_mode: string | null;
  can_delete_events: number;
  role_level: number;
  role_name: string;
}

interface MemberJoinRow {
  id: string;
  user_id: string;
  role_id: string;
  role_level: number;
  role_name: string;
  display_name: string | null;
  first_name: string | null;
}

export interface CalendarDetailMember {
  id: string;
  user_id: string;
  role_id: string;
  role_level: number;
  role_name: string;
  display_name: string;
  avatar_initial: string;
}

export interface CalendarDetailPermissions {
  canView: boolean;
  canEnterEdit: boolean;
  canSave: boolean;
  canDelete: boolean;
  canCreateEvent: boolean;
  isFreeBusy: boolean;
}

export function useCalendarDetail(calendarId: string | undefined) {
  const { authUser } = useCurrentUser();
  const userId = authUser?.id;

  // 1. Calendar by id
  const { data: calendars = [], isLoading: calLoading } = useQuery<Calendar>(
    calendarId
      ? 'SELECT * FROM calendars WHERE id = ? AND deleted_at IS NULL'
      : 'SELECT * FROM calendars WHERE 0',
    calendarId ? [calendarId] : []
  );
  const calendar = calendars[0] ?? null;

  // 2. Owner user by calendar.owner_id
  const { data: owners = [] } = useQuery<User>(
    calendar?.owner_id ? 'SELECT * FROM users WHERE id = ?' : 'SELECT * FROM users WHERE 0',
    calendar?.owner_id ? [calendar.owner_id] : []
  );
  const ownerName = owners[0]?.display_name ?? owners[0]?.first_name ?? '';

  // 3. Current user's membership (joined with roles)
  const { data: memberships = [] } = useQuery<MembershipJoinRow>(
    calendarId && userId
      ? `SELECT cm.*, r.level AS role_level, r.name AS role_name
         FROM calendar_members cm
         JOIN roles r ON cm.role_id = r.id
         WHERE cm.calendar_id = ? AND cm.user_id = ? AND cm.deleted_at IS NULL`
      : 'SELECT * FROM calendar_members WHERE 0',
    calendarId && userId ? [calendarId, userId] : []
  );
  const currentMembership = memberships[0] ?? null;

  // 4. All members (joined with roles + users)
  const { data: memberRows = [] } = useQuery<MemberJoinRow>(
    calendarId
      ? `SELECT cm.id, cm.user_id, cm.role_id,
                r.level AS role_level, r.name AS role_name,
                u.display_name, u.first_name
         FROM calendar_members cm
         JOIN roles r ON cm.role_id = r.id
         LEFT JOIN users u ON cm.user_id = u.id
         WHERE cm.calendar_id = ? AND cm.deleted_at IS NULL`
      : 'SELECT * FROM calendar_members WHERE 0',
    calendarId ? [calendarId] : []
  );

  const members = useMemo<CalendarDetailMember[]>(() => {
    return memberRows
      .map((m) => {
        const display = (m.display_name ?? m.first_name ?? '?').trim();
        return {
          id: m.id,
          user_id: m.user_id,
          role_id: m.role_id,
          role_level: m.role_level,
          role_name: m.role_name,
          display_name: display || '?',
          avatar_initial: (display[0] ?? '?').toUpperCase(),
        };
      })
      .sort((a, b) => {
        if (a.role_level !== b.role_level) return b.role_level - a.role_level;
        return a.display_name.localeCompare(b.display_name);
      });
  }, [memberRows]);

  // 5. Upcoming events
  const nowIso = useMemo(() => new Date().toISOString(), [calendarId]);
  const { data: upcomingEvents = [] } = useQuery<Event>(
    calendarId
      ? `SELECT * FROM events
         WHERE calendar_id = ? AND deleted_at IS NULL AND start_time >= ?
         ORDER BY start_time ASC`
      : 'SELECT * FROM events WHERE 0',
    calendarId ? [calendarId, nowIso] : []
  );

  const effectiveViewMode = currentMembership?.view_mode ?? calendar?.default_view_mode ?? 'full';

  const permissions = useMemo<CalendarDetailPermissions>(() => {
    const lvl = currentMembership?.role_level ?? 0;
    const isFreeBusy = effectiveViewMode === 'free_busy';
    return {
      canView: lvl >= 10,
      canEnterEdit: lvl >= 30,
      canSave: lvl >= 30,
      canDelete: lvl === 40,
      canCreateEvent: lvl >= 20 && !isFreeBusy,
      isFreeBusy,
    };
  }, [currentMembership, effectiveViewMode]);

  return {
    calendar,
    ownerName,
    currentMembership,
    members,
    upcomingEvents,
    effectiveViewMode,
    permissions,
    isLoading: calLoading,
  };
}
