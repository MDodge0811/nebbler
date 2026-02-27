import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ViewToken } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { ScheduleHeader } from '@components/schedule/ScheduleHeader';
import { CalendarContainer } from '@components/schedule/CalendarContainer';
import { EventFeed, type EventFeedRef } from '@components/schedule/EventFeed';
import { useScheduleFeed } from '@hooks/useScheduleFeed';
import { useCalendarEvents, useMarkedDates } from '@hooks/useCalendarEvents';
import { useScheduleStore } from '@stores/useScheduleStore';
import { getMonthBufferRange, monthKeyOf } from '@utils/dateRange';

const containerStyle = tva({ base: 'flex-1 bg-background-0' });
const errorBannerStyle = tva({ base: 'bg-error-50 px-4 py-2' });
const errorTextStyle = tva({ base: 'text-sm text-error-600' });

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
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Clear any pending timers on unmount
  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // In month mode, drive query range from displayMonth so far-off months load events.
  // In week mode, drive from selectedDate as before.
  const viewMode = useScheduleStore((s) => s.viewMode);
  const displayMonth = useScheduleStore((s) => s.displayMonth);
  const queryAnchor = viewMode === 'month' ? displayMonth : selectedDate;
  const monthKey = monthKeyOf(queryAnchor);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally memoize by month, not by day
  const { startDate, endDate } = useMemo(() => getMonthBufferRange(queryAnchor), [monthKey]);
  const { sections, isLoading, error: feedError } = useScheduleFeed(startDate, endDate, today);

  // Calendar event dots — shared date range with the feed query
  const { data: calendarEvents = [], error: calendarEventsError } = useCalendarEvents(
    startDate,
    endDate
  );
  const markedDates = useMarkedDates(calendarEvents);

  useEffect(() => {
    if (feedError) console.error('[ScheduleScreen] Schedule feed query failed:', feedError);
    if (calendarEventsError)
      console.error('[ScheduleScreen] Calendar events query failed:', calendarEventsError);
  }, [feedError, calendarEventsError]);

  const handleNavigateToProfile = useCallback(() => {
    navigation.navigate('Profile');
  }, [navigation]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // TODO: tie to actual PowerSync reconnect/sync trigger once available.
    // PowerSync syncs reactively — this is cosmetic for now.
    refreshTimerRef.current = setTimeout(() => setRefreshing(false), 800);
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

      const topDate = (topItem.section as { title?: string })?.title;
      if (!topDate || topDate === useScheduleStore.getState().selectedDate) return;

      lockSync();
      selectDate(topDate);
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
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
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(unlockSync, CALENDAR_SYNC_UNLOCK_DELAY_MS);
    },
    [sections, lockSync, unlockSync]
  );

  const error = feedError ?? calendarEventsError;

  return (
    <Box className={containerStyle({})}>
      <ScheduleHeader onNavigateToProfile={handleNavigateToProfile} />
      <CalendarContainer onDateSelected={handleDateSelected} markedDates={markedDates} />
      {error && (
        <Box className={errorBannerStyle({})}>
          <Text className={errorTextStyle({})}>
            Could not load your schedule. Pull down to retry.
          </Text>
        </Box>
      )}
      {isLoading && sections.length === 0 ? (
        <Box className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </Box>
      ) : (
        <EventFeed
          ref={feedRef}
          sections={sections}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onViewableItemsChanged={handleViewableItemsChanged}
        />
      )}
    </Box>
  );
}
