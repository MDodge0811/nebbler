import { useQuery } from '@powersync/react';
import { useMemo } from 'react';

import type { CalendarGroupMembership } from '@database/schema';
import { useCalendarGroups } from '@hooks/useCalendarGroups';
import { useCalendars } from '@hooks/useCalendars';
import { useCurrentUser } from '@hooks/useCurrentUser';

/**
 * Composite hook aggregating all data needed for CalendarsListScreen.
 * Derives group ordering, group→calendar mapping, and member counts.
 */
export function useCalendarsListData() {
  const { user } = useCurrentUser();
  const { data: groups, isLoading: groupsLoading, error: groupsError } = useCalendarGroups();
  const { data: calendars, isLoading: calendarsLoading, error: calendarsError } = useCalendars();

  const {
    data: allMemberships,
    isLoading: membershipsLoading,
    error: membershipsError,
  } = useQuery<CalendarGroupMembership>(
    'SELECT * FROM calendar_group_memberships WHERE deleted_at IS NULL'
  );

  const {
    data: memberCounts,
    isLoading: memberCountsLoading,
    error: memberCountsError,
  } = useQuery<{ calendar_id: string; member_count: number }>(
    `SELECT calendar_id, COUNT(*) as member_count
     FROM calendar_members WHERE deleted_at IS NULL
     GROUP BY calendar_id`
  );

  const isLoading = groupsLoading || calendarsLoading || membershipsLoading || memberCountsLoading;
  const error = groupsError ?? calendarsError ?? membershipsError ?? memberCountsError;

  const primaryGroupId = user?.primary_calendar_group_id ?? null;

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      if (a.id === primaryGroupId) return -1;
      if (b.id === primaryGroupId) return 1;
      return (a.name ?? '').localeCompare(b.name ?? '');
    });
  }, [groups, primaryGroupId]);

  const groupCalendarsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const m of allMemberships) {
      if (!m.calendar_group_id || !m.calendar_id) continue;
      map[m.calendar_group_id] ??= [];
      map[m.calendar_group_id]!.push(m.calendar_id);
    }
    return map;
  }, [allMemberships]);

  const ungroupedCalendars = useMemo(() => {
    const groupedIds = new Set(allMemberships.map((m) => m.calendar_id));
    return calendars.filter((c) => !groupedIds.has(c.id));
  }, [calendars, allMemberships]);

  const memberCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of memberCounts) {
      map[row.calendar_id] = row.member_count;
    }
    return map;
  }, [memberCounts]);

  const calendarsById = useMemo(() => {
    const map: Record<string, (typeof calendars)[number]> = {};
    for (const c of calendars) {
      map[c.id] = c;
    }
    return map;
  }, [calendars]);

  return {
    primaryGroupId,
    sortedGroups,
    groupCalendarsMap,
    ungroupedCalendars,
    memberCountMap,
    calendarsById,
    allMemberships,
    isLoading,
    error,
  };
}
