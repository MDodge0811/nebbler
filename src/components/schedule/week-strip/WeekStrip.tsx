import { useCallback, useEffect, useRef } from 'react';
import {
  FlatList,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { View } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { WeekStripDayCell } from './WeekStripDayCell';
import { useWeekPages, type WeekPage } from './useWeekPages';
import { getWeekMonth } from '@utils/weekUtils';
import { useScheduleStore } from '@stores/useScheduleStore';

const containerStyle = tva({ base: 'bg-background-0' });

interface WeekStripProps {
  onDateSelected?: (date: string) => void;
  markedDates: Record<string, { marked: true; dotColor: string }>;
}

export function WeekStrip({ onDateSelected, markedDates }: WeekStripProps) {
  const { width: screenWidth } = useWindowDimensions();
  const selectedDate = useScheduleStore((s) => s.selectedDate);
  const today = useScheduleStore((s) => s.today);
  const setVisibleDate = useScheduleStore((s) => s.setVisibleDate);

  const { weeks, centerIndex, getPageIndexForDate } = useWeekPages(today);
  const flatListRef = useRef<FlatList<WeekPage>>(null);
  const currentPageRef = useRef(centerIndex);

  // Sync FlatList position when selectedDate changes externally (e.g., feed scroll)
  useEffect(() => {
    const pageIndex = getPageIndexForDate(selectedDate);
    if (pageIndex == null || pageIndex === currentPageRef.current) return;
    currentPageRef.current = pageIndex;
    flatListRef.current?.scrollToIndex({ index: pageIndex, animated: false });
  }, [selectedDate, getPageIndexForDate]);

  const handleDayPress = useCallback(
    (date: string) => {
      if (useScheduleStore.getState().isSyncLocked) return;
      useScheduleStore.getState().selectDate(date);
      onDateSelected?.(date);
    },
    [onDateSelected]
  );

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
      if (page === currentPageRef.current) return;
      currentPageRef.current = page;

      const weekStart = weeks[page]?.key;
      if (!weekStart) return;

      const weekMonth = getWeekMonth(weekStart);
      const currentVisible = useScheduleStore.getState().visibleDate;
      if (weekMonth !== currentVisible) {
        setVisibleDate(weekMonth);
      }
    },
    [screenWidth, weeks, setVisibleDate]
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: screenWidth,
      offset: screenWidth * index,
      index,
    }),
    [screenWidth]
  );

  const renderWeekPage = useCallback(
    ({ item }: { item: WeekPage }) => (
      <View style={{ width: screenWidth, flexDirection: 'row', paddingHorizontal: 8 }}>
        {item.dates.map((dateStr) => {
          const day = parseInt(dateStr.slice(8), 10);
          const mark = markedDates[dateStr];
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
            />
          );
        })}
      </View>
    ),
    [screenWidth, selectedDate, today, markedDates, handleDayPress]
  );

  const keyExtractor = useCallback((item: WeekPage) => item.key, []);

  return (
    <Box className={containerStyle({})}>
      <FlatList
        ref={flatListRef}
        style={{ height: 40 }}
        data={weeks}
        renderItem={renderWeekPage}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
        initialScrollIndex={centerIndex}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      />
    </Box>
  );
}
