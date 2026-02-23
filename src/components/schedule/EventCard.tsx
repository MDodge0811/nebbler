import { View } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { getCalendarColor } from '@utils/calendarColor';
import { formatTimeRange } from '@utils/formatTime';
import type { FeedEvent } from '@hooks/useScheduleFeed';
import type { ReactNode } from 'react';

const cardStyle = tva({ base: 'mx-4 mb-3 overflow-hidden rounded-xl shadow-sm' });
const bodyStyle = tva({ base: 'px-4 py-3' });
const titleStyle = tva({ base: 'text-base font-bold text-typography-900' });
const timeStyle = tva({ base: 'mt-1 text-sm text-typography-500' });
const calendarRowStyle = tva({ base: 'mt-2 items-center gap-2' });
const calendarNameStyle = tva({ base: 'text-xs text-typography-400' });

interface EventCardProps {
  event: FeedEvent;
  onPress?: () => void;
  footer?: ReactNode;
}

export function EventCard({ event, onPress, footer }: EventCardProps) {
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
        <View style={{ backgroundColor: color, minHeight: 72 }} />
        <VStack className={bodyStyle({})}>
          <Text className={titleStyle({})}>{event.title}</Text>
          {timeRange ? <Text className={timeStyle({})}>{timeRange}</Text> : null}
          <HStack className={calendarRowStyle({})}>
            <View
              style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }}
              accessibilityLabel="Calendar color"
            />
            <Text className={calendarNameStyle({})}>{event.calendar_name}</Text>
          </HStack>
        </VStack>
        {footer ?? null}
      </Box>
    </Pressable>
  );
}
