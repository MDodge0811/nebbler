import { useCallback, useEffect, useRef } from 'react';
import {
  FlatList,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { WeekStripDayCell } from '@components/schedule/week-strip/WeekStripDayCell';
import { useMonthPages, type MonthPage } from './useMonthPages';
import { isDateInMonth, getMonthStart } from '@utils/monthUtils';
import { useScheduleStore } from '@stores/useScheduleStore';

export const ROW_HEIGHT = 40;

interface MonthGridProps {
  onDateSelected?: (date: string) => void;
  markedDates: Record<string, { marked: true; dotColor: string }>;
}

export function MonthGrid({ onDateSelected, markedDates }: MonthGridProps) {
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
      if (useScheduleStore.getState().isSyncLocked) return;

      const currentMonth = useScheduleStore.getState().displayMonth;
      if (!isDateInMonth(date, currentMonth)) {
        // Adjacent month day tap — navigate to that month
        const targetMonth = getMonthStart(date);
        setDisplayMonth(targetMonth);
      }

      useScheduleStore.getState().selectDate(date);
      onDateSelected?.(date);
    },
    [onDateSelected, setDisplayMonth]
  );

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
      if (page === currentPageRef.current) return;
      currentPageRef.current = page;

      const monthKey = months[page]?.key;
      if (!monthKey) return;

      setDisplayMonth(monthKey);
      setVisibleDate(monthKey);
    },
    [screenWidth, months, setDisplayMonth, setVisibleDate]
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
      <View style={{ width: screenWidth }}>
        {item.grid.rows.map((row, rowIdx) => (
          <View
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
                  hasEvent={!!mark}
                  dotColor={mark?.dotColor ?? ''}
                  onPress={handleDayPress}
                  isAdjacentMonth={adjacent}
                />
              );
            })}
          </View>
        ))}
      </View>
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
