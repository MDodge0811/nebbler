import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ViewToken } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { ScheduleHeader } from '@components/schedule/ScheduleHeader';
import { CalendarContainer } from '@components/schedule/CalendarContainer';
import { EventFeed, type EventFeedRef } from '@components/schedule/EventFeed';
import { useScheduleFeed } from '@hooks/useScheduleFeed';
import { useCalendarEvents, useMarkedDates } from '@hooks/useCalendarEvents';
import { useScheduleStore } from '@stores/useScheduleStore';
import { getMonthBufferRange, monthKeyOf } from '@utils/dateRange';

const containerStyle = tva({ base: 'flex-1 bg-background-0' });

// Delay (ms) before unlocking scroll↔calendar sync. Shorter for feed-driven
// updates (the calendar strip moves instantly), longer for calendar-driven
// updates (the animated scroll needs time to settle).
const FEED_SYNC_UNLOCK_DELAY_MS = 100;
const CALENDAR_SYNC_UNLOCK_DELAY_MS = 300;

export function ScheduleScreen() {
  const navigation = useNavigation();
  const selectedDate = useScheduleStore((s) => s.selectedDate);
  const today = useScheduleStore((s) => s.today);
  const lockSync = useScheduleStore((s) => s.lockSync);
  const unlockSync = useScheduleStore((s) => s.unlockSync);
  const selectDate = useScheduleStore((s) => s.selectDate);
  const [refreshing, setRefreshing] = useState(false);

  const feedRef = useRef<EventFeedRef>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Clear any pending sync-unlock timer on unmount
  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, []);

  // Memoize by month key so the query only re-runs when the month changes
  const monthKey = monthKeyOf(selectedDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally memoize by month, not by day
  const { startDate, endDate } = useMemo(() => getMonthBufferRange(selectedDate), [monthKey]);
  const { sections } = useScheduleFeed(startDate, endDate, today);

  // Calendar event dots — shared date range with the feed query
  const { data: calendarEvents = [] } = useCalendarEvents(startDate, endDate);
  const markedDates = useMarkedDates(calendarEvents);

  const handleNavigateToProfile = useCallback(() => {
    navigation.navigate('Profile');
  }, [navigation]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // PowerSync syncs reactively — this is cosmetic
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // Feed scroll → calendar update
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      // Read lock/mode state at call time to avoid stale closure
      if (useScheduleStore.getState().isSyncLocked) return;
      if (useScheduleStore.getState().viewMode === 'month') return;

      // Find the topmost visible section header date
      const topItem = viewableItems.find((item) => item.section != null);
      if (!topItem?.section) return;

      const topDate = (topItem.section as { title: string }).title;
      if (topDate === useScheduleStore.getState().selectedDate) return;

      lockSync();
      selectDate(topDate);
      syncTimerRef.current = setTimeout(unlockSync, FEED_SYNC_UNLOCK_DELAY_MS);
    },
    [lockSync, selectDate, unlockSync]
  );

  // Calendar tap → feed scroll (week mode only; month mode drives its own selection)
  const handleDateSelected = useCallback(
    (date: string) => {
      if (useScheduleStore.getState().viewMode === 'month') return;

      const sectionIndex = sections.findIndex((s) => s.title === date);
      if (sectionIndex === -1) return;

      lockSync();
      feedRef.current?.scrollToSection(sectionIndex);
      syncTimerRef.current = setTimeout(unlockSync, CALENDAR_SYNC_UNLOCK_DELAY_MS);
    },
    [sections, lockSync, unlockSync]
  );

  return (
    <Box className={containerStyle({})}>
      <ScheduleHeader onNavigateToProfile={handleNavigateToProfile} />
      <CalendarContainer onDateSelected={handleDateSelected} markedDates={markedDates} />
      <EventFeed
        ref={feedRef}
        sections={sections}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onViewableItemsChanged={handleViewableItemsChanged}
      />
    </Box>
  );
}
