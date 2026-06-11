import { type BottomSheetModal } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import type { FlashListRef } from '@shopify/flash-list';
import React, { useCallback, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { RefreshControl } from 'react-native';

import { Box } from '@/components/ui/box';
import {
  AllDayCard,
  BusyCard,
  DayHeaderRow,
  EventCardCompact,
  EventCardFull,
  NowLineRow,
  QuietDayCard,
} from '@components/schedule/cards';
import type { EventCardProps } from '@components/schedule/cards';
import { EventMeatballSheet } from '@components/schedule/EventMeatballSheet';
import { useScheduleStore } from '@stores/useScheduleStore';
import { getCalendarColor } from '@utils/calendarColor';
import { formatTimeRange } from '@utils/formatTime';
import type { FeedEvent, FeedRow } from '@utils/scheduleFeed';

// ViewToken from FlashList — mirrors the shape of RN's ViewToken but without .section
export interface FlashListViewToken {
  item: FeedRow;
  key: string;
  index: number | null;
  isViewable: boolean;
  timestamp: number;
}

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export interface EventFeedRef {
  scrollToIndex: (index: number, opts?: { animated?: boolean }) => void;
}

interface EventFeedProps {
  rows: FeedRow[];
  refreshing: boolean;
  onRefresh: () => void;
  onEventPress?: (event: FeedEvent) => void;
  onViewableItemsChanged?: (info: { viewableItems: FlashListViewToken[] }) => void;
  onMomentumScrollEnd?: () => void;
  onScrollBeginDrag?: () => void;
}

// -----------------------------------------------------------------------
// Viewability config — stable reference, never recreated
// -----------------------------------------------------------------------

const viewabilityConfig = {
  viewAreaCoveragePercentThreshold: 50,
  minimumViewTime: 150,
} as const;

// -----------------------------------------------------------------------
// FeedEvent → card props mapping
// -----------------------------------------------------------------------

function feedEventToCardProps(
  event: FeedEvent,
  onPress?: () => void,
  onLongPress?: () => void
): EventCardProps {
  const tintColor = event.calendar_color ?? getCalendarColor(event.calendar_id ?? '');
  const timeRange =
    event.start_time && event.end_time ? formatTimeRange(event.start_time, event.end_time) : '';

  // Note: location, commentCount, hasUnreadComments, photoUri are omitted
  // (placeholders — data doesn't exist yet; cards render nothing for absent props).
  // Omitting rather than setting undefined is required by exactOptionalPropertyTypes.
  const props: EventCardProps = {
    title: event.title ?? '',
    timeRange,
    tintColor,
    starred: event.starred,
    attendees: event.attendees,
  };
  if (onPress) props.onPress = onPress;
  if (onLongPress) props.onLongPress = onLongPress;
  return props;
}

// -----------------------------------------------------------------------
// Explicit-props helpers — avoids spread-swallowing narrower card types
// -----------------------------------------------------------------------

function renderAllDayCard(
  event: FeedEvent,
  onPress: () => void,
  onLongPress: () => void
): React.ReactElement {
  const tintColor = event.calendar_color ?? getCalendarColor(event.calendar_id ?? '');
  const timeRange =
    event.start_time && event.end_time ? formatTimeRange(event.start_time, event.end_time) : '';
  return (
    <AllDayCard
      title={event.title ?? ''}
      timeRange={timeRange}
      tintColor={tintColor}
      starred={event.starred}
      onPress={onPress}
      onLongPress={onLongPress}
    />
  );
}

function renderBusyCard(event: FeedEvent): React.ReactElement {
  const timeRange =
    event.start_time && event.end_time ? formatTimeRange(event.start_time, event.end_time) : '';
  return <BusyCard timeRange={timeRange} />;
}

// -----------------------------------------------------------------------
// EventFeed
// -----------------------------------------------------------------------

export const EventFeed = forwardRef<EventFeedRef, EventFeedProps>(function EventFeed(
  {
    rows,
    refreshing,
    onRefresh,
    onEventPress,
    onViewableItemsChanged,
    onMomentumScrollEnd,
    onScrollBeginDrag,
  },
  ref
) {
  const today = useScheduleStore((s) => s.today);

  const flashListRef = useRef<FlashListRef<FeedRow>>(null);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [meatballEvent, setMeatballEvent] = useState<FeedEvent | null>(null);

  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number, opts?: { animated?: boolean }) => {
      if (index < 0 || index >= rows.length) return;
      void flashListRef.current?.scrollToIndex({ index, animated: opts?.animated ?? true });
    },
  }));

  // Keep callback refs stable so FlashList doesn't re-subscribe on every render
  const onViewableItemsChangedRef = useRef(onViewableItemsChanged);
  onViewableItemsChangedRef.current = onViewableItemsChanged;

  const onMomentumScrollEndRef = useRef(onMomentumScrollEnd);
  onMomentumScrollEndRef.current = onMomentumScrollEnd;

  const onScrollBeginDragRef = useRef(onScrollBeginDrag);
  onScrollBeginDragRef.current = onScrollBeginDrag;

  const handleViewableItemsChanged = useCallback(
    (info: { viewableItems: FlashListViewToken[]; changed: FlashListViewToken[] }) => {
      onViewableItemsChangedRef.current?.(info);
    },
    []
  );

  const handleMomentumScrollEnd = useCallback(() => {
    onMomentumScrollEndRef.current?.();
  }, []);

  // A user-initiated drag always cancels an in-flight programmatic scroll — this
  // is the escape hatch that prevents programmaticScrollTarget from sticking when
  // a programmatic scrollToIndex never fires momentum / never reaches the target.
  const handleScrollBeginDrag = useCallback(() => {
    onScrollBeginDragRef.current?.();
  }, []);

  const handleMeatballPress = useCallback((event: FeedEvent) => {
    setMeatballEvent(event);
    bottomSheetRef.current?.present();
  }, []);

  const handleDismissSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    setMeatballEvent(null);
  }, []);

  // 'event' rows render two structurally different trees (full vs compact);
  // give them separate recycling pools so FlashList doesn't swap layouts.
  const getItemType = useCallback(
    (row: FeedRow) => (row.kind === 'event' ? `event-${row.mode}` : row.kind),
    []
  );

  const keyExtractor = useCallback(
    (row: FeedRow) => `${row.kind}:${row.date}:${'event' in row ? row.event.id : ''}`,
    []
  );

  const renderItem = useCallback(
    ({ item: row }: { item: FeedRow }) => {
      switch (row.kind) {
        case 'day-header':
          return <DayHeaderRow date={row.date} today={today} summary={row.summary} />;

        case 'event': {
          const props = feedEventToCardProps(
            row.event,
            () => onEventPress?.(row.event),
            () => handleMeatballPress(row.event)
          );
          return row.mode === 'compact' ? (
            <EventCardCompact {...props} />
          ) : (
            <EventCardFull {...props} />
          );
        }

        case 'all-day':
          return renderAllDayCard(
            row.event,
            () => onEventPress?.(row.event),
            () => handleMeatballPress(row.event)
          );

        case 'busy':
          return renderBusyCard(row.event);

        case 'quiet-day':
          return <QuietDayCard />;

        case 'now-line':
          return <NowLineRow label={row.label} />;

        default:
          return null;
      }
    },
    [today, onEventPress, handleMeatballPress]
  );

  return (
    <>
      <Box className="flex-1">
        <FlashList
          ref={flashListRef}
          data={rows}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onScrollBeginDrag={handleScrollBeginDrag}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      </Box>
      <EventMeatballSheet
        ref={bottomSheetRef}
        event={meatballEvent}
        onEdit={handleDismissSheet}
        onDelete={handleDismissSheet}
        onShare={handleDismissSheet}
      />
    </>
  );
});
