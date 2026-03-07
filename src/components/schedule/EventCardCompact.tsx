import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { AttendeeRow, type Attendee } from '@components/schedule/AttendeeRow';
import { getCalendarColor } from '@utils/calendarColor';
import { formatTimeShort } from '@utils/formatTime';
import type { FeedEvent } from '@hooks/useScheduleFeed';

const cardStyle = tva({
  base: 'mx-4 mb-2 overflow-hidden rounded-lg border-[0.5px] border-outline-200 shadow-sm',
});
const rowStyle = tva({ base: 'flex-1 items-center justify-between px-3' });
const titleStyle = tva({ base: 'flex-1 text-sm font-semibold text-typography-900' });
const timeStyle = tva({ base: 'mx-2 text-xs text-typography-500' });

interface EventCardCompactProps {
  event: FeedEvent;
  onPress?: () => void;
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
        <HStack style={styles.container}>
          <View style={[styles.colorBar, { backgroundColor: color }]} />
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

const styles = StyleSheet.create({
  container: {
    height: 56,
    alignItems: 'center',
  },
  colorBar: {
    width: 4,
    alignSelf: 'stretch',
  },
});
