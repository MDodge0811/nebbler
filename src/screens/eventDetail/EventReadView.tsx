import { ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { Calendar, Event, User } from '@database/schema';
import { formatEventDateTime } from '@utils/formatTime';

import {
  calendarDotStyle,
  calendarNameStyle,
  containerStyle,
  deleteButtonStyle,
  deleteButtonTextStyle,
  dividerStyle,
  sectionLabelStyle,
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
      <ScrollView contentContainerClassName="grow">
        <VStack className="px-4 pt-4">
          {/* Title */}
          <VStack className="py-4">
            <Text className="text-xl font-bold text-typography-900">{event.title}</Text>
          </VStack>
          <Box className={dividerStyle({})} />

          {/* Calendar */}
          <HStack className="items-center py-4">
            <DynamicColorView className={calendarDotStyle({})} backgroundColor={calendarColor} />
            <Text className={calendarNameStyle({})}>{calendar?.name ?? 'Calendar'}</Text>
          </HStack>
          <Box className={dividerStyle({})} />

          {/* Creator */}
          {creator && (
            <>
              <VStack className="py-4">
                <Text className={sectionLabelStyle({})}>Created by</Text>
                <Text className={valueStyle({})}>{formatCreatorName(creator)}</Text>
              </VStack>
              <Box className={dividerStyle({})} />
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
          <Box className={dividerStyle({})} />

          {/* Description */}
          {event.description ? (
            <>
              <VStack className="py-4">
                <Text className={sectionLabelStyle({})}>Description</Text>
                <Text className={valueStyle({})}>{event.description}</Text>
              </VStack>
              <Box className={dividerStyle({})} />
            </>
          ) : null}
        </VStack>

        {/* Delete button */}
        {canDelete && (
          <Pressable className={deleteButtonStyle({})} onPress={onDelete}>
            <Text className={deleteButtonTextStyle({})}>Delete Event</Text>
          </Pressable>
        )}
      </ScrollView>
    </Box>
  );
}
