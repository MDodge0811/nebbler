import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { memo, useCallback } from 'react';
import Svg, { Path } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { DynamicColorText, DynamicColorView } from '@/components/ui/dynamic';
import { Pressable } from '@/components/ui/pressable';
import { calendarColors } from '@constants/calendarColors';

const STAR_COLOR = '#FBBF24';
// Standard 5-point star path, centered in 10×10 viewBox
const STAR_PATH =
  'M5 1 L6.18 3.82 L9.51 4.09 L7.14 6.15 L7.87 9.41 L5 7.7 L2.13 9.41 L2.86 6.15 L0.49 4.09 L3.82 3.82 Z';

const cellStyle = tva({ base: 'flex-1 items-center justify-center' });
const dayNumberStyle = tva({ base: 'text-base font-medium leading-none' });
// Dots live INSIDE the bubble (Fantastical-style), pinned to the bottom so the
// number stays vertically centered regardless of how many dots there are.
const dotRowStyle = tva({
  base: 'absolute bottom-[3px] left-0 right-0 flex-row items-center justify-center gap-[2px]',
});
// Bubble holds the centered number; dots overlay its bottom. Selected: filled
// pill. Today only: green numeral.
const circleStyle = tva({
  base: 'relative h-8 w-8 items-center justify-center rounded-full',
  variants: {
    selected: { true: 'bg-brand-primary' },
  },
});
// Dot className variants by size (week=3px, month=2px)
const dotWeekClass = 'h-[3px] w-[3px] rounded-full';
const dotMonthClass = 'h-[2px] w-[2px] rounded-full';

export interface WeekStripDayCellProps {
  dateString: string;
  dayNumber: number;
  isSelected: boolean;
  isToday: boolean;
  /** Up to 3 calendar hex colors for the density dots */
  dotColors: string[];
  /** Dot size variant — 'week' (4px) or 'month' (3px). Default: 'week'. */
  dotVariant?: 'week' | 'month';
  onPress: (date: string) => void;
  isAdjacentMonth?: boolean;
  /** Show gold star marker (top-right corner) — month-scale signal only */
  starred?: boolean;
}

export const WeekStripDayCell = memo(function WeekStripDayCell({
  dateString,
  dayNumber,
  isSelected,
  isToday,
  dotColors,
  dotVariant = 'week',
  onPress,
  isAdjacentMonth,
  starred = false,
}: WeekStripDayCellProps) {
  const handlePress = useCallback(() => onPress(dateString), [onPress, dateString]);

  // Selection wins over adjacent-month fading: tapping an adjacent day no longer
  // re-centers the grid, so the selected indicator must stay visible on it.
  const isSelectedCircle = isSelected;
  // Today and not selected and not adjacent: green numeral only (no ring/pill)
  const isTodayOnly = isToday && !isSelected && !isAdjacentMonth;

  const textColor = isSelectedCircle
    ? '#FFFFFF'
    : isAdjacentMonth
      ? calendarColors.disabled
      : isTodayOnly
        ? calendarColors.today
        : calendarColors.dayText;

  const dotClass = dotVariant === 'month' ? dotMonthClass : dotWeekClass;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={dateString}
      className="flex-1"
    >
      <Box className={cellStyle({})}>
        <Box className="relative">
          <Box className={circleStyle({ selected: isSelectedCircle })}>
            <DynamicColorText className={dayNumberStyle({})} color={textColor}>
              {dayNumber}
            </DynamicColorText>
            <Box className={dotRowStyle({})}>
              {dotColors.slice(0, 4).map((color, i) => (
                <DynamicColorView
                  key={i}
                  className={dotClass}
                  backgroundColor={color}
                  testID="event-dot"
                />
              ))}
            </Box>
          </Box>
          {starred && !isAdjacentMonth && (
            <Box className="absolute right-0 top-0" testID="star-marker">
              <Svg width={8} height={8} viewBox="0 0 10 10">
                <Path d={STAR_PATH} fill={STAR_COLOR} />
              </Svg>
            </Box>
          )}
        </Box>
      </Box>
    </Pressable>
  );
});
