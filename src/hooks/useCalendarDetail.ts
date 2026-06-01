import { useQuery } from '@powersync/react';
import { useEffect, useMemo, useState } from 'react';

import type { Calendar, Event, User } from '@database/schema';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { firstRow, reactiveQuery } from '@utils/reactiveQuery';

function pickName(user?: Pick<User, 'display_name' | 'first_name'>): string {
  return user?.display_name ?? user?.first_name ?? '';
}

function resolveViewMode(
  membership: Pick<MembershipJoinRow, 'view_mode'> | null,
  calendar: Pick<Calendar, 'default_view_mode'> | null
): string {
  return membership?.view_mode ?? calendar?.default_view_mode ?? 'full';
}

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
  const [calSql, calParams] = reactiveQuery(
    !!calendarId,
    'SELECT * FROM calendars WHERE id = ? AND deleted_at IS NULL',
    [calendarId]
  );
  const { data: calendars = [], isLoading: calLoading } = useQuery<Calendar>(calSql, calParams);
  const calendar = firstRow(calendars);

  // 2. Owner user by calendar.owner_id
  const ownerId = calendar?.owner_id;
  const [ownerSql, ownerParams] = reactiveQuery(!!ownerId, 'SELECT * FROM users WHERE id = ?', [
    ownerId,
  ]);
  const { data: owners = [] } = useQuery<User>(ownerSql, ownerParams);
  const ownerName = pickName(owners[0]);

  // 3. Current user's membership (joined with roles)
  const [memSql, memParams] = reactiveQuery(
    !!(calendarId && userId),
    `SELECT cm.id, cm.calendar_id, cm.user_id, cm.role_id, cm.view_mode,
                r.level AS role_level, r.name AS role_name
         FROM calendar_members cm
         JOIN roles r ON cm.role_id = r.id
         WHERE cm.calendar_id = ? AND cm.user_id = ? AND cm.deleted_at IS NULL`,
    [calendarId, userId]
  );
  const { data: memberships = [] } = useQuery<MembershipJoinRow>(memSql, memParams);
  const currentMembership = firstRow(memberships);

  // 4. All members (joined with roles + users)
  const [membersSql, membersParams] = reactiveQuery(
    !!calendarId,
    `SELECT cm.id, cm.user_id, cm.role_id,
                r.level AS role_level, r.name AS role_name,
                u.display_name, u.first_name
         FROM calendar_members cm
         JOIN roles r ON cm.role_id = r.id
         LEFT JOIN users u ON cm.user_id = u.id
         WHERE cm.calendar_id = ? AND cm.deleted_at IS NULL`,
    [calendarId]
  );
  const { data: memberRows = [] } = useQuery<MemberJoinRow>(membersSql, membersParams);

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
  const [eventsSql, eventsParams] = reactiveQuery(
    !!calendarId,
    `SELECT * FROM events
         WHERE calendar_id = ? AND deleted_at IS NULL AND start_time >= ?
         ORDER BY start_time ASC`,
    [calendarId, nowIso]
  );
  const { data: upcomingEvents = [] } = useQuery<Event>(eventsSql, eventsParams);

  const effectiveViewMode = resolveViewMode(currentMembership, calendar);

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
