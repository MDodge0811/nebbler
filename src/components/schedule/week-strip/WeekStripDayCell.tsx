import { memo, useCallback } from 'react';
import { View } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { calendarColors } from '@constants/calendarColors';

const cellStyle = tva({ base: 'flex-1 items-center py-1' });
const dayNumberStyle = tva({ base: 'text-base font-medium' });
const dotContainerStyle = tva({ base: 'h-2 items-center justify-center' });

interface WeekStripDayCellProps {
  dateString: string;
  dayNumber: number;
  isSelected: boolean;
  isToday: boolean;
  hasEvent: boolean;
  dotColor: string;
  onPress: (date: string) => void;
}

export const WeekStripDayCell = memo(function WeekStripDayCell({
  dateString,
  dayNumber,
  isSelected,
  isToday,
  hasEvent,
  dotColor,
  onPress,
}: WeekStripDayCellProps) {
  const handlePress = useCallback(() => onPress(dateString), [onPress, dateString]);

  const isTodayOnly = isToday && !isSelected;
  const circleColor = isSelected ? calendarColors.selected : undefined;
  const textColor = isSelected ? '#FFFFFF' : calendarColors.dayText;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={dateString}
      style={{ flex: 1 }}
    >
      <View className={cellStyle({})}>
        <View
          style={[
            {
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
            },
            circleColor
              ? { backgroundColor: circleColor }
              : isTodayOnly
                ? { borderWidth: 2, borderColor: calendarColors.today }
                : undefined,
          ]}
        >
          <Text className={dayNumberStyle({})} style={{ color: textColor }}>
            {dayNumber}
          </Text>
        </View>
        <View className={dotContainerStyle({})}>
          {hasEvent ? (
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: dotColor,
              }}
              testID="event-dot"
            />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});
