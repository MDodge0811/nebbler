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
  const programmaticScrollTarget = useScheduleStore((s) => s.programmaticScrollTarget);
  const setProgrammaticScrollTarget = useScheduleStore((s) => s.setProgrammaticScrollTarget);
  const [refreshing, setRefreshing] = useState(false);

  const feedRef = useRef<EventFeedRef>(null);
  // The feed's actual top day-header date, updated by viewability. This — NOT the
  // store's visibleDate (which selectDate sets synchronously before the tap handler
  // runs, and which swipes set to a synthetic YYYY-MM-01) — is the real "is the
  // feed already on this day?" signal for the zero-distance guard.
  const topVisibleDateRef = useRef<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Clear timers and global store state on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      // programmaticScrollTarget lives in the global store; clear it on unmount
      // so we don't strand it across navigation cycles.
      setProgrammaticScrollTarget(null);
    };
  }, [setProgrammaticScrollTarget]);

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
  const markedDates = useMarkedDates(events, starredIds);

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

  // -----------------------------------------------------------------------
  // User scrolls → update calendar (lock-free)
  // -----------------------------------------------------------------------
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: FlashListViewToken[] }) => {
      // Always track the feed's real top day-header (used by the zero-distance guard).
      const topHeader = viewableItems.find((vt) => vt.item.kind === 'day-header');
      if (topHeader) topVisibleDateRef.current = topHeader.item.date;

      // Suppress selection updates while a programmatic scroll is in flight.
      const target = useScheduleStore.getState().programmaticScrollTarget;
      if (target !== null) {
        // Safety-clear: if the target date's header is now visible, we're done.
        if (topHeader?.item.date === target) {
          setProgrammaticScrollTarget(null);
        }
        return;
      }

      if (!topHeader) return;

      const topDate = topHeader.item.date;
      if (!topDate || topDate === useScheduleStore.getState().selectedDate) return;

      // selectDate already sets both selectedDate and visibleDate — no setVisibleDate needed.
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
    [selectDate, setDisplayMonth, setProgrammaticScrollTarget]
  );

  // -----------------------------------------------------------------------
  // Momentum scroll ends → clear programmaticScrollTarget
  // -----------------------------------------------------------------------
  const handleMomentumScrollEnd = useCallback(() => {
    setProgrammaticScrollTarget(null);
  }, [setProgrammaticScrollTarget]);

  // A user drag cancels any in-flight programmatic scroll. This is the deadlock
  // escape hatch: a programmatic scrollToIndex may never fire onMomentumScrollEnd
  // (it's not a fling) and the target header may never cross the viewability bar
  // (e.g. last few days), which would otherwise leave the flag stuck and freeze
  // feed→calendar sync until remount.
  const handleScrollBeginDrag = useCallback(() => {
    if (useScheduleStore.getState().programmaticScrollTarget !== null) {
      setProgrammaticScrollTarget(null);
    }
  }, [setProgrammaticScrollTarget]);

  // -----------------------------------------------------------------------
  // Calendar tap → scroll feed (lock-free, no setTimeout)
  // -----------------------------------------------------------------------
  const handleDateSelected = useCallback(
    (date: string) => {
      // (a) Zero-distance tap: the feed's actual top is already this day — just
      // update the selection highlight and return without arming a no-op scroll.
      // (Uses the viewability-tracked ref, not visibleDate, which selectDate has
      // already set to `date` by the time this runs — see WeekStrip/MonthGrid.)
      if (date === topVisibleDateRef.current) {
        selectDate(date);
        return;
      }

      selectDate(date);
      const index = indexByDate.get(date);

      if (index === undefined) {
        // (c) Filtered: if starredOnly is on, the day may not appear in the feed
        // at all — don't set the flag (it would stick forever).
        if (useScheduleStore.getState().starredOnly) {
          return;
        }
        // Out-of-window: set target; effect below scrolls once rows load.
        setProgrammaticScrollTarget(date);
        return;
      }

      // (b) Single scroll owner: set target here; the effect fires and scrolls.
      setProgrammaticScrollTarget(date);
    },
    [indexByDate, selectDate, setProgrammaticScrollTarget]
  );

  // -----------------------------------------------------------------------
  // Out-of-window scroll-after-load effect (sole scroll owner)
  // Fires when programmaticScrollTarget, indexByDate, or isLoading changes.
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!programmaticScrollTarget) return;
    const index = indexByDate.get(programmaticScrollTarget);

    if (index !== undefined) {
      // Row is now in the window — scroll to it.
      feedRef.current?.scrollToIndex(index, { animated: true });
      // programmaticScrollTarget is cleared by onMomentumScrollEnd or by the
      // safety-clear in handleViewableItemsChanged once the header becomes visible.
      return;
    }

    // (c) Index is still undefined after fetching settled → the day will never
    // appear (e.g. no starred events on that date, or out-of-range entirely).
    // Clear the target so it can't stick. Gate on isFetching (not isLoading,
    // which is first-load-only) so we don't clear mid month-window reload while
    // the row is still on its way in.
    if (!isFetching) {
      setProgrammaticScrollTarget(null);
    }
  }, [programmaticScrollTarget, indexByDate, isFetching, setProgrammaticScrollTarget]);

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
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollBeginDrag={handleScrollBeginDrag}
      />
    );
  }

  return (
    <Box className={containerStyle({})}>
      <ScheduleHeader />
      <CalendarContainer onDateSelected={handleDateSelected} markedDates={markedDates} />
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
