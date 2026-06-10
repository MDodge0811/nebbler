import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { CalendarContainer } from '@components/schedule/CalendarContainer';
import {
  EventFeed,
  type EventFeedRef,
  type FlashListViewToken,
} from '@components/schedule/EventFeed';
import { ScheduleHeader } from '@components/schedule/ScheduleHeader';
import { useCalendarEvents, useMarkedDates } from '@hooks/useCalendarEvents';
import { useEventStars } from '@hooks/useEventStars';
import { useScheduleFeed } from '@hooks/useScheduleFeed';
import { useScheduleStore } from '@stores/useScheduleStore';
import { getMonthBufferRange, monthKeyOf } from '@utils/dateRange';
import type { FeedEvent } from '@utils/scheduleFeed';

const containerStyle = tva({ base: 'flex-1 bg-background-0' });
const errorBannerStyle = tva({ base: 'bg-error-50 px-4 py-2' });
const errorTextStyle = tva({ base: 'text-sm text-error-600' });

export function ScheduleScreen() {
  const navigation = useNavigation();
  const selectedDate = useScheduleStore((s) => s.selectedDate);
  const today = useScheduleStore((s) => s.today);
  const selectDate = useScheduleStore((s) => s.selectDate);
  const setVisibleDate = useScheduleStore((s) => s.setVisibleDate);
  const programmaticScrollTarget = useScheduleStore((s) => s.programmaticScrollTarget);
  const setProgrammaticScrollTarget = useScheduleStore((s) => s.setProgrammaticScrollTarget);
  const [refreshing, setRefreshing] = useState(false);

  const feedRef = useRef<EventFeedRef>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // In month mode, drive query range from displayMonth so far-off months load events.
  // In week mode, drive from selectedDate as before.
  const viewMode = useScheduleStore((s) => s.viewMode);
  const displayMonth = useScheduleStore((s) => s.displayMonth);
  const setDisplayMonth = useScheduleStore((s) => s.setDisplayMonth);
  const queryAnchor = viewMode === 'month' ? displayMonth : selectedDate;
  const monthKey = monthKeyOf(queryAnchor);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally memoize by month, not by day
  const { startDate, endDate } = useMemo(() => getMonthBufferRange(queryAnchor), [monthKey]);
  const {
    rows,
    indexByDate,
    isLoading,
    error: feedError,
  } = useScheduleFeed(startDate, endDate, today);

  // Calendar event dots — shared date range with the feed query
  const { data: calendarEvents = [], error: calendarEventsError } = useCalendarEvents(
    startDate,
    endDate
  );
  const starredIds = useEventStars();
  const markedDates = useMarkedDates(calendarEvents, starredIds);

  useEffect(() => {
    if (feedError) console.error('[ScheduleScreen] Schedule feed query failed:', feedError);
    if (calendarEventsError)
      console.error('[ScheduleScreen] Calendar events query failed:', calendarEventsError);
  }, [feedError, calendarEventsError]);

  const handleNavigateToProfile = useCallback(() => {
    navigation.navigate('Profile');
  }, [navigation]);

  const handleEventPress = useCallback(
    (event: FeedEvent) => {
      navigation.navigate('EventDetail', { eventId: event.id });
    },
    [navigation]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // TODO: tie to actual PowerSync reconnect/sync trigger once available.
    // PowerSync syncs reactively — this is cosmetic for now.
    refreshTimerRef.current = setTimeout(() => setRefreshing(false), 800);
  }, []);

  // -----------------------------------------------------------------------
  // User scrolls → update calendar (lock-free)
  // -----------------------------------------------------------------------
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: FlashListViewToken[] }) => {
      // Suppress while a programmatic scroll is in flight
      const target = useScheduleStore.getState().programmaticScrollTarget;
      if (target !== null) {
        // Safety-clear: if the target date's header is now visible, we're done
        const targetVisible = viewableItems.some(
          (vt) => vt.item.kind === 'day-header' && vt.item.date === target
        );
        if (targetVisible) {
          setProgrammaticScrollTarget(null);
        }
        return;
      }

      // Find the topmost visible day-header row
      const topHeader = viewableItems.find((vt) => vt.item.kind === 'day-header');
      if (!topHeader) return;

      const topDate = topHeader.item.date;
      if (!topDate || topDate === useScheduleStore.getState().selectedDate) return;

      setVisibleDate(topDate);
      selectDate(topDate);

      // In month mode, auto-advance the month grid if we scrolled into a new month
      const state = useScheduleStore.getState();
      if (state.viewMode === 'month') {
        const topMonthStart = topDate.slice(0, 7) + '-01';
        if (topMonthStart !== state.displayMonth) {
          setDisplayMonth(topMonthStart);
        }
      }
    },
    [selectDate, setVisibleDate, setDisplayMonth, setProgrammaticScrollTarget]
  );

  // -----------------------------------------------------------------------
  // Momentum scroll ends → clear programmaticScrollTarget
  // -----------------------------------------------------------------------
  const handleMomentumScrollEnd = useCallback(() => {
    setProgrammaticScrollTarget(null);
  }, [setProgrammaticScrollTarget]);

  // -----------------------------------------------------------------------
  // Calendar tap → scroll feed (lock-free, no setTimeout)
  // -----------------------------------------------------------------------
  const handleDateSelected = useCallback(
    (date: string) => {
      selectDate(date);
      const index = indexByDate.get(date);
      if (index === undefined) {
        // Out-of-window: set target; effect below will scroll once rows load
        setProgrammaticScrollTarget(date);
        return;
      }

      setProgrammaticScrollTarget(date);
      feedRef.current?.scrollToIndex(index, { animated: true });
    },
    [indexByDate, selectDate, setProgrammaticScrollTarget]
  );

  // -----------------------------------------------------------------------
  // Out-of-window scroll-after-load effect
  // Fires whenever programmaticScrollTarget or indexByDate changes.
  // If we have a pending target AND the index is now available, scroll.
  // -----------------------------------------------------------------------
  const programmaticScrollTargetRef = useRef(programmaticScrollTarget);
  programmaticScrollTargetRef.current = programmaticScrollTarget;

  useEffect(() => {
    if (!programmaticScrollTarget) return;
    const index = indexByDate.get(programmaticScrollTarget);
    if (index === undefined) return;
    // The row is now in the loaded window — scroll to it
    feedRef.current?.scrollToIndex(index, { animated: true });
    // Note: programmaticScrollTarget is cleared by onMomentumScrollEnd or
    // by the safety-clear in handleViewableItemsChanged.
  }, [programmaticScrollTarget, indexByDate]);

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
      {isLoading && rows.length === 0 ? (
        <Box className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </Box>
      ) : (
        <EventFeed
          ref={feedRef}
          rows={rows}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEventPress={handleEventPress}
          onViewableItemsChanged={handleViewableItemsChanged}
          onMomentumScrollEnd={handleMomentumScrollEnd}
        />
      )}
    </Box>
  );
}
