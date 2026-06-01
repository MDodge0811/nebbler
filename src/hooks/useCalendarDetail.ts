import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@powersync/react';
import { useCurrentUser } from '@hooks/useCurrentUser';
import type { Calendar, Event, User } from '@database/schema';

interface MembershipJoinRow {
  id: string;
  calendar_id: string;
  user_id: string;
  role_id: string;
  view_mode: string | null;
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

/**
 * Composite hook for the Calendar Detail screen.
 *
 * Returns the calendar, its owner's display name, the current user's
 * membership (with joined role level/name), the full member roster sorted
 * by role then name, upcoming events (start_time >= now), the effective
 * view mode (membership override falling back to calendar default), and
 * computed permissions.
 *
 * All queries are reactive PowerSync queries and respect deleted_at.
 */
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
      ? `SELECT cm.id, cm.calendar_id, cm.user_id, cm.role_id, cm.view_mode,
                r.level AS role_level, r.name AS role_name
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

  // 5. Upcoming events — nowIso re-buckets once per minute so the list stays fresh.
  //    useState + setInterval is the idiomatic way to have a periodically-updated
  //    reactive value; useMemo can't express "recompute on a timer" without a dep.
  const [nowIso, setNowIso] = useState(() => new Date().toISOString());
  useEffect(() => {
    const id = setInterval(() => {
      setNowIso(new Date().toISOString());
    }, 60_000);
    return () => clearInterval(id);
  }, []);
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
    if (!userId) {
      return {
        canView: false,
        canEnterEdit: false,
        canSave: false,
        canDelete: false,
        canCreateEvent: false,
        isFreeBusy: false,
      };
    }
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
  }, [userId, currentMembership, effectiveViewMode]);

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
