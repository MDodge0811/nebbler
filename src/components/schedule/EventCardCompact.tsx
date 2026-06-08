import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { memo } from 'react';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { AttendeeRow, type Attendee } from '@components/schedule/AttendeeRow';
import type { FeedEvent } from '@hooks/useScheduleFeed';
import { getCalendarColor } from '@utils/calendarColor';
import { formatTimeShort } from '@utils/formatTime';

const cardStyle = tva({
  base: 'mx-4 mb-2 overflow-hidden rounded-lg border-[0.5px] border-outline-200 shadow-sm',
});
const rowStyle = tva({ base: 'flex-1 items-center justify-between px-3' });
const titleStyle = tva({ base: 'flex-1 text-sm font-semibold text-typography-900' });
const timeStyle = tva({ base: 'mx-2 text-xs text-typography-500' });

interface EventCardCompactProps {
  event: FeedEvent;
  onPress?: (() => void) | undefined;
  attendees?: Attendee[];
}

export const EventCardCompact = memo(function EventCardCompact({
  event,
  onPress,
  attendees = [],
}: EventCardCompactProps) {
  const color = getCalendarColor(event.calendar_id ?? '');
  const time = event.start_time ? formatTimeShort(event.start_time) : '';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={event.title ?? undefined}
    >
      <Box className={cardStyle({})}>
        <HStack className="h-[56px] items-center">
          <DynamicColorView className="w-1 self-stretch" backgroundColor={color} />
          <HStack className={rowStyle({})}>
            <Text className={titleStyle({})} numberOfLines={1}>
              {event.title}
            </Text>
            {time ? <Text className={timeStyle({})}>{time}</Text> : null}
            {attendees.length > 0 && <AttendeeRow attendees={attendees} size={16} maxVisible={2} />}
          </HStack>
        </HStack>
      </Box>
    </Pressable>
  );
});
