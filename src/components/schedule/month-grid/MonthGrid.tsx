import { useCallback, useEffect, useRef } from 'react';
import {
  FlatList,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';

import { Box } from '@/components/ui/box';
import { WeekStripDayCell } from '@components/schedule/week-strip/WeekStripDayCell';
import { NO_DOTS } from '@hooks/useCalendarEvents';
import type { MarkedDates } from '@hooks/useCalendarEvents';
import { useScheduleStore } from '@stores/useScheduleStore';
import { isDateInMonth } from '@utils/monthUtils';

import { useMonthPages, type MonthPage } from './useMonthPages';

export const ROW_HEIGHT = 40;

interface MonthGridProps {
  onDateSelected?: (date: string) => void;
  /** Fired when a horizontal swipe settles on a different month (YYYY-MM-01). */
  onMonthChanged?: (monthStart: string) => void;
  markedDates: MarkedDates;
}

export function MonthGrid({ onDateSelected, onMonthChanged, markedDates }: MonthGridProps) {
  const { width: screenWidth } = useWindowDimensions();
  const selectedDate = useScheduleStore((s) => s.selectedDate);
  const today = useScheduleStore((s) => s.today);
  const displayMonth = useScheduleStore((s) => s.displayMonth);
  const setDisplayMonth = useScheduleStore((s) => s.setDisplayMonth);
  const setVisibleDate = useScheduleStore((s) => s.setVisibleDate);

  const { months, centerIndex, getPageIndexForMonth } = useMonthPages(displayMonth);
  const flatListRef = useRef<FlatList<MonthPage>>(null);
  const currentPageRef = useRef(centerIndex);

  // Sync FlatList position when displayMonth changes externally
  useEffect(() => {
    const pageIndex = getPageIndexForMonth(displayMonth);
    if (pageIndex == null || pageIndex === currentPageRef.current) return;
    currentPageRef.current = pageIndex;
    flatListRef.current?.scrollToOffset({
      offset: screenWidth * pageIndex,
      animated: false,
    });
  }, [displayMonth, getPageIndexForMonth, screenWidth]);

  const handleDayPress = useCallback(
    (date: string) => {
      const currentMonth = useScheduleStore.getState().displayMonth;
      useScheduleStore.getState().selectDate(date);
      // Adjacent-month days (e.g. July 1 shown faded in June's grid) select and
      // scroll the feed like any other day, but the grid AND header stay on the
      // displayed month — they don't advance until the user swipes. selectDate
      // moved visibleDate to the tapped day, so pin the header back.
      if (!isDateInMonth(date, currentMonth)) {
        setVisibleDate(currentMonth);
      }
      onDateSelected?.(date);
    },
    [onDateSelected, setVisibleDate]
  );

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
      if (page === currentPageRef.current) return;
      currentPageRef.current = page;

      const monthKey = months[page]?.key;
      if (!monthKey) return;

      setDisplayMonth(monthKey);
      // Deterministic landing: the screen selects the 1st and scrolls the
      // feed through the same path as a day tap. (visibleDate is set by
      // selectDate inside that path — no separate write here.)
      onMonthChanged?.(monthKey);
    },
    [screenWidth, months, setDisplayMonth, onMonthChanged]
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: screenWidth,
      offset: screenWidth * index,
      index,
    }),
    [screenWidth]
  );

  const renderMonthPage = useCallback(
    ({ item }: { item: MonthPage }) => (
      <Box style={{ width: screenWidth }}>
        {item.grid.rows.map((row, rowIdx) => (
          <Box
            key={rowIdx}
            style={{ flexDirection: 'row', height: ROW_HEIGHT, paddingHorizontal: 8 }}
          >
            {row.map((dateStr) => {
              const day = parseInt(dateStr.slice(8), 10);
              const mark = markedDates[dateStr];
              const adjacent = !isDateInMonth(dateStr, item.key);
              return (
                <WeekStripDayCell
                  key={dateStr}
                  dateString={dateStr}
                  dayNumber={day}
                  isSelected={dateStr === selectedDate}
                  isToday={dateStr === today}
                  dotColors={mark?.colors ?? NO_DOTS}
                  dotVariant="month"
                  onPress={handleDayPress}
                  isAdjacentMonth={adjacent}
                  starred={mark?.starred ?? false}
                />
              );
            })}
          </Box>
        ))}
      </Box>
    ),
    [screenWidth, selectedDate, today, markedDates, handleDayPress]
  );

  const keyExtractor = useCallback((item: MonthPage) => item.key, []);

  return (
    <FlatList
      ref={flatListRef}
      data={months}
      renderItem={renderMonthPage}
      keyExtractor={keyExtractor}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      getItemLayout={getItemLayout}
      initialScrollIndex={centerIndex}
      initialNumToRender={3}
      windowSize={3}
      maxToRenderPerBatch={1}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      testID="month-grid-flatlist"
    />
  );
}
