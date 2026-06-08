import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { memo, useCallback } from 'react';

import { Box } from '@/components/ui/box';
import { DynamicColorText, DynamicColorView } from '@/components/ui/dynamic';
import { Pressable } from '@/components/ui/pressable';
import { calendarColors } from '@constants/calendarColors';

const cellStyle = tva({ base: 'flex-1 items-center py-1' });
const dayNumberStyle = tva({ base: 'text-base font-medium' });
const dotContainerStyle = tva({ base: 'h-2 items-center justify-center' });
// selected + today share the brand-primary hex (#00DB74), so the circle is a
// static variant rather than a dynamic-color door.
const circleStyle = tva({
  base: 'h-9 w-9 items-center justify-center rounded-full',
  variants: {
    selected: { true: 'bg-brand-primary' },
    today: { true: 'border-[2px] border-brand-primary' },
  },
});

interface WeekStripDayCellProps {
  dateString: string;
  dayNumber: number;
  isSelected: boolean;
  isToday: boolean;
  hasEvent: boolean;
  dotColor: string;
  onPress: (date: string) => void;
  isAdjacentMonth?: boolean;
}

export const WeekStripDayCell = memo(function WeekStripDayCell({
  dateString,
  dayNumber,
  isSelected,
  isToday,
  hasEvent,
  dotColor,
  onPress,
  isAdjacentMonth,
}: WeekStripDayCellProps) {
  const handlePress = useCallback(() => onPress(dateString), [onPress, dateString]);

  const isSelectedCircle = isSelected && !isAdjacentMonth;
  const isTodayOnly = isToday && !isSelected && !isAdjacentMonth;
  const textColor = isAdjacentMonth
    ? calendarColors.disabled
    : isSelected
      ? '#FFFFFF'
      : calendarColors.dayText;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={dateString}
      className="flex-1"
    >
      <Box className={cellStyle({})}>
        <Box className={circleStyle({ selected: isSelectedCircle, today: isTodayOnly })}>
          <DynamicColorText className={dayNumberStyle({})} color={textColor}>
            {dayNumber}
          </DynamicColorText>
        </Box>
        <Box className={dotContainerStyle({})}>
          {hasEvent ? (
            <DynamicColorView
              className="h-[5px] w-[5px] rounded-full"
              backgroundColor={dotColor}
              testID="event-dot"
            />
          ) : null}
        </Box>
      </Box>
    </Pressable>
  );
});
