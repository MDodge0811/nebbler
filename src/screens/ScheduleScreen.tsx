import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { useNavigation } from '@react-navigation/native';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useMarkedDates } from '@hooks/useCalendarEvents';
import { useScheduleFeed } from '@hooks/useScheduleFeed';
import { useScheduleStore } from '@stores/useScheduleStore';
import { getMonthBufferRange, monthKeyOf } from '@utils/dateRange';
import type { FeedEvent } from '@utils/scheduleFeed';

const containerStyle = tva({ base: 'flex-1 bg-background-0' });
const errorBannerStyle = tva({ base: 'bg-error-50 px-4 py-2' });
const errorTextStyle = tva({ base: 'text-sm text-error-600' });
const emptyZoneStyle = tva({ base: 'flex-1 items-center justify-center px-8' });
const emptyTitleStyle = tva({ base: 'text-lg font-semibold text-typography-900' });
const emptyBodyStyle = tva({ base: 'mt-1 text-center text-sm text-typography-500' });

export function ScheduleScreen() {
  const navigation = useNavigation();
  const selectedDate = useScheduleStore((s) => s.selectedDate);
  const today = useScheduleStore((s) => s.today);
  const selectDate = useScheduleStore((s) => s.selectDate);
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
  const starredOnly = useScheduleStore((s) => s.starredOnly);
  const queryAnchor = viewMode === 'month' ? displayMonth : selectedDate;
  const monthKey = monthKeyOf(queryAnchor);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally memoize by month, not by day
  const { startDate, endDate } = useMemo(() => getMonthBufferRange(queryAnchor), [monthKey]);
  const {
    events,
    rows,
    indexByDate,
    starredIds,
    isLoading,
    isFetching,
    error: feedError,
  } = useScheduleFeed(startDate, endDate, today, starredOnly);

  // Calendar event dots — derived from the feed's single membership-scoped
  // subscription so dots and feed rows always agree on which events exist.
  const markedDates = useMarkedDates(events, startDate, endDate, starredIds);

  useEffect(() => {
    if (feedError) console.error('[ScheduleScreen] Schedule feed query failed:', feedError);
  }, [feedError]);

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

  // ---------------------------------------------------------------------
  // Scroll-sync state — all screen-local. Feed→calendar sync runs ONLY
  // while the user is actively scrolling (drag → momentum settle), so
  // programmatic scrolls and data-window rebuilds can never write
  // selection. No global flag, no clearing heuristics, no deadlocks: these
  // refs gate only whether a sync happens, never whether taps work.
  // ---------------------------------------------------------------------
  const isDraggingRef = useRef(false);
  const isMomentumRef = useRef(false);
  // True from a programmatic scrollToIndex until it is cleared by either the next
  // onScrollBeginDrag (user drag) or, on iOS, the onMomentumScrollEnd that the
  // programmatic scroll itself fires. On Android a programmatic scroll may never
  // fire momentum events, so this stays true until the next drag start — the only
  // consequence is that feed→calendar sync is suppressed in that gap (the calendar
  // highlight was already set by selectDate in handleDateSelected).
  const suppressSyncRef = useRef(false);
  // The feed's actual top day-header, tracked from viewability.
  const topVisibleDateRef = useRef<string | null>(null);
  // Out-of-window tap target — scrolled to once indexByDate contains it.
  const [pendingScrollDate, setPendingScrollDate] = useState<string | null>(null);

  const scrollFeedToIndex = useCallback((index: number) => {
    suppressSyncRef.current = true;
    feedRef.current?.scrollToIndex(index, { animated: true });
  }, []);

  const syncCalendarToDate = useCallback(
    (topDate: string) => {
      if (topDate === useScheduleStore.getState().selectedDate) return;
      selectDate(topDate);
      // In month mode, auto-advance the grid when the feed crosses a month.
      const state = useScheduleStore.getState();
      if (state.viewMode === 'month') {
        const topMonthStart = topDate.slice(0, 7) + '-01';
        if (topMonthStart !== state.displayMonth) {
          setDisplayMonth(topMonthStart);
        }
      }
    },
    [selectDate, setDisplayMonth]
  );

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: FlashListViewToken[] }) => {
      const topHeader = viewableItems.find((vt) => vt.item.kind === 'day-header');
      if (!topHeader) return;
      topVisibleDateRef.current = topHeader.item.date;
      if (!suppressSyncRef.current && (isDraggingRef.current || isMomentumRef.current)) {
        syncCalendarToDate(topHeader.item.date);
      }
    },
    [syncCalendarToDate]
  );

  const handleScrollBeginDrag = useCallback(() => {
    isDraggingRef.current = true;
    suppressSyncRef.current = false; // the user took over
    setPendingScrollDate(null); // and superseded any deferred tap-scroll
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    isDraggingRef.current = false;
    // onScrollEndDrag fires BEFORE onMomentumScrollBegin, so isMomentumRef is still
    // false here for both a fling and a slow drag. For a fling this yields an
    // intermediate read at lift-off; the momentum phase (viewability) and
    // onMomentumScrollEnd then emit the authoritative settled position. For a slow
    // drag with no fling, this is the only sync point. (The isMomentumRef guard is
    // kept as a defensive no-op against platforms that reorder these events.)
    if (!isMomentumRef.current && topVisibleDateRef.current) {
      syncCalendarToDate(topVisibleDateRef.current);
    }
  }, [syncCalendarToDate]);

  const handleMomentumScrollBegin = useCallback(() => {
    isMomentumRef.current = true;
  }, []);

  const handleMomentumScrollEnd = useCallback(() => {
    isMomentumRef.current = false;
    if (!suppressSyncRef.current && topVisibleDateRef.current) {
      // Final settle of a user fling.
      syncCalendarToDate(topVisibleDateRef.current);
    }
    // A programmatic scroll's own momentum-end (iOS) consumes the suppression.
    suppressSyncRef.current = false;
  }, [syncCalendarToDate]);

  // ---------------------------------------------------------------------
  // Calendar tap → scroll feed
  // ---------------------------------------------------------------------
  const handleDateSelected = useCallback(
    (date: string) => {
      selectDate(date);
      const index = indexByDate.get(date);
      if (index !== undefined) {
        setPendingScrollDate(null);
        scrollFeedToIndex(index);
        return;
      }
      // Filtered day under starredOnly never appears — don't defer.
      if (useScheduleStore.getState().starredOnly) return;
      // Out-of-window: scroll once the new window's rows include the date.
      setPendingScrollDate(date);
    },
    [indexByDate, selectDate, scrollFeedToIndex]
  );

  // Month swipe lands deterministically: select the 1st of the new month and
  // scroll the feed there via the exact same path as a calendar day tap.
  const handleMonthChanged = useCallback(
    (monthStart: string) => {
      handleDateSelected(monthStart);
    },
    [handleDateSelected]
  );

  // Deferred scroll for out-of-window taps.
  useEffect(() => {
    if (!pendingScrollDate) return;
    const index = indexByDate.get(pendingScrollDate);
    if (index !== undefined) {
      scrollFeedToIndex(index);
      setPendingScrollDate(null);
      return;
    }
    // Fetching settled and the date never appeared (out of range) — drop it.
    if (!isFetching) {
      setPendingScrollDate(null);
    }
  }, [pendingScrollDate, indexByDate, isFetching, scrollFeedToIndex]);

  const error = feedError;

  let feedBody: ReactNode;
  if (isLoading && rows.length === 0) {
    feedBody = (
      <Box className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </Box>
    );
  } else if (rows.length === 0 && starredOnly) {
    // Star filter on with nothing starred in range — explain the empty feed.
    feedBody = (
      <Box className={emptyZoneStyle({})}>
        <Text className={emptyTitleStyle({})}>No starred events</Text>
        <Text className={emptyBodyStyle({})}>Tap the star on an event to see it here.</Text>
      </Box>
    );
  } else {
    feedBody = (
      <EventFeed
        ref={feedRef}
        rows={rows}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEventPress={handleEventPress}
        onViewableItemsChanged={handleViewableItemsChanged}
        onMomentumScrollBegin={handleMomentumScrollBegin}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
      />
    );
  }

  return (
    <Box className={containerStyle({})}>
      <ScheduleHeader />
      <CalendarContainer
        onDateSelected={handleDateSelected}
        onMonthChanged={handleMonthChanged}
        markedDates={markedDates}
      />
      {error && (
        <Box className={errorBannerStyle({})}>
          <Text className={errorTextStyle({})}>
            Could not load your schedule. Pull down to retry.
          </Text>
        </Box>
      )}
      {feedBody}
    </Box>
  );
}
