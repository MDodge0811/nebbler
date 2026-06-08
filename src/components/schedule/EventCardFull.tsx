import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { AttendeeRow, type Attendee } from '@components/schedule/AttendeeRow';
import { MeatballMenuButton } from '@components/schedule/MeatballMenuButton';
import type { FeedEvent } from '@hooks/useScheduleFeed';
import { getCalendarColor } from '@utils/calendarColor';
import { formatTimeRange } from '@utils/formatTime';

const cardStyle = tva({
  base: 'mx-4 mb-3 overflow-hidden rounded-xl border-[0.5px] border-outline-200 shadow-sm',
});
const bodyStyle = tva({ base: 'px-4 py-3' });
const titleStyle = tva({ base: 'text-base font-bold text-typography-900' });
const timeStyle = tva({ base: 'mt-1 text-sm text-typography-500' });
const locationStyle = tva({ base: 'mt-1 text-sm text-typography-500' });
const calendarRowStyle = tva({ base: 'mt-2 items-center justify-between' });
const calendarNameStyle = tva({ base: 'text-xs text-typography-400' });
const calendarIndicatorStyle = tva({ base: 'items-center gap-2' });

interface EventCardFullProps {
  event: FeedEvent;
  onPress?: (() => void) | undefined;
  onMeatballPress?: (() => void) | undefined;
  attendees?: Attendee[];
  footer?: ReactNode;
}

export const EventCardFull = memo(function EventCardFull({
  event,
  onPress,
  onMeatballPress,
  attendees = [],
  footer,
}: EventCardFullProps) {
  const color = getCalendarColor(event.calendar_id ?? '');
  const timeRange =
    event.start_time && event.end_time ? formatTimeRange(event.start_time, event.end_time) : '';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={event.title ?? undefined}
    >
      <Box className={cardStyle({})}>
        {/* Gradient header */}
        <Box className="relative min-h-9">
          <LinearGradient
            colors={[color, adjustAlpha(color, 0.6)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {onMeatballPress && (
            <Box className="absolute right-2 top-2">
              <MeatballMenuButton onPress={onMeatballPress} />
            </Box>
          )}
        </Box>

        {/* Body */}
        <VStack className={bodyStyle({})}>
          <Text className={titleStyle({})}>{event.title}</Text>
          {timeRange ? <Text className={timeStyle({})}>{timeRange}</Text> : null}
          {(event as FeedEvent & { location?: string }).location ? (
            <Text className={locationStyle({})}>
              {(event as FeedEvent & { location?: string }).location}
            </Text>
          ) : null}

          <HStack className={calendarRowStyle({})}>
            {attendees.length > 0 ? <AttendeeRow attendees={attendees} size={24} /> : <Box />}
            <HStack className={calendarIndicatorStyle({})}>
              <DynamicColorView
                className="h-2 w-2 rounded-full"
                backgroundColor={color}
                accessibilityLabel="Calendar color"
              />
              <Text className={calendarNameStyle({})}>{event.calendar_name}</Text>
            </HStack>
          </HStack>
        </VStack>
        {footer ?? null}
      </Box>
    </Pressable>
  );
});

function adjustAlpha(hex: string, alpha: number): string {
  const alphaHex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return hex + alphaHex;
}
