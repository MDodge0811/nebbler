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

const cellStyle = tva({ base: 'flex-1 items-center py-1' });
const dayNumberStyle = tva({ base: 'text-base font-medium' });
// Fixed-height dot row so layout never jumps (even with 0 dots)
const dotContainerStyle = tva({ base: 'h-2 flex-row items-center gap-[2px]' });
// Selected (non-adjacent): filled green pill. Today only: NO ring/pill — green numeral only.
const circleStyle = tva({
  base: 'h-9 w-9 items-center justify-center rounded-full',
  variants: {
    selected: { true: 'bg-brand-primary' },
  },
});
// Dot className variants by size (week=4px, month=3px)
const dotWeekClass = 'h-[4px] w-[4px] rounded-full';
const dotMonthClass = 'h-[3px] w-[3px] rounded-full';

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

  const isSelectedCircle = isSelected && !isAdjacentMonth;
  // Today and not selected and not adjacent: green numeral only (no ring/pill)
  const isTodayOnly = isToday && !isSelected && !isAdjacentMonth;

  const textColor = isAdjacentMonth
    ? calendarColors.disabled
    : isSelectedCircle
      ? '#FFFFFF'
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
          </Box>
          {starred && !isAdjacentMonth && (
            <Box className="absolute right-0 top-0" testID="star-marker">
              <Svg width={8} height={8} viewBox="0 0 10 10">
                <Path d={STAR_PATH} fill={STAR_COLOR} />
              </Svg>
            </Box>
          )}
        </Box>
        <Box className={dotContainerStyle({})}>
          {dotColors.slice(0, 3).map((color, i) => (
            <DynamicColorView
              key={i}
              className={dotClass}
              backgroundColor={color}
              testID="event-dot"
            />
          ))}
        </Box>
      </Box>
    </Pressable>
  );
});
