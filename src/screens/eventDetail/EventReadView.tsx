import { Pressable as RNPressable, ScrollView, Text as RNText, View } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { Calendar, Event, User } from '@database/schema';
import { formatEventDateTime } from '@utils/formatTime';

import {
  calendarNameStyle,
  containerStyle,
  dividerStyle,
  sectionLabelStyle,
  styles,
  valueStyle,
} from './styles';

function formatCreatorName(creator: User): string | null {
  return (
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- display_name can be '' (not set), which should fall through to first+last name; || is intentional
    creator.display_name ||
    `${creator.first_name ?? ''} ${creator.last_name ?? ''}`.trim() ||
    creator.email
  );
}

interface EventReadViewProps {
  event: Event;
  calendar: Calendar | null;
  creator: User | null;
  calendarColor: string;
  canDelete: boolean;
  onDelete: () => void;
}

export function EventReadView({
  event,
  calendar,
  creator,
  calendarColor,
  canDelete,
  onDelete,
}: EventReadViewProps) {
  return (
    <Box className={containerStyle({})}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <VStack className="px-4 pt-4">
          {/* Title */}
          <VStack className="py-4">
            <Text className="text-xl font-bold text-typography-900">{event.title}</Text>
          </VStack>
          <View className={dividerStyle({})} />

          {/* Calendar */}
          <HStack className="items-center py-4">
            <View
              style={[styles.calendarDot, { backgroundColor: calendarColor, marginRight: 10 }]}
            />
            <Text className={calendarNameStyle({})}>{calendar?.name ?? 'Calendar'}</Text>
          </HStack>
          <View className={dividerStyle({})} />

          {/* Creator */}
          {creator && (
            <>
              <VStack className="py-4">
                <Text className={sectionLabelStyle({})}>Created by</Text>
                <Text className={valueStyle({})}>{formatCreatorName(creator)}</Text>
              </VStack>
              <View className={dividerStyle({})} />
            </>
          )}

          {/* Date/time */}
          <VStack className="py-4">
            <Text className={sectionLabelStyle({})}>Date & Time</Text>
            <Text className={valueStyle({})}>
              {event.start_time && event.end_time
                ? formatEventDateTime(event.start_time, event.end_time)
                : ''}
            </Text>
          </VStack>
          <View className={dividerStyle({})} />

          {/* Description */}
          {event.description ? (
            <>
              <VStack className="py-4">
                <Text className={sectionLabelStyle({})}>Description</Text>
                <Text className={valueStyle({})}>{event.description}</Text>
              </VStack>
              <View className={dividerStyle({})} />
            </>
          ) : null}
        </VStack>

        {/* Delete button */}
        {canDelete && (
          <RNPressable style={styles.deleteButton} onPress={onDelete}>
            <RNText style={styles.deleteButtonText}>Delete Event</RNText>
          </RNPressable>
        )}
      </ScrollView>
    </Box>
  );
}
