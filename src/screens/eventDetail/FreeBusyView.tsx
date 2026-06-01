import { ScrollView, View } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { Calendar, Event } from '@database/schema';
import { formatEventDateTime } from '@utils/formatTime';

import {
  calendarNameStyle,
  containerStyle,
  dividerStyle,
  sectionLabelStyle,
  styles,
  valueStyle,
} from './styles';

interface FreeBusyViewProps {
  event: Event;
  calendar: Calendar | null;
  calendarColor: string;
}

export function FreeBusyView({ event, calendar, calendarColor }: FreeBusyViewProps) {
  return (
    <Box className={containerStyle({})}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <VStack className="px-4 pt-4">
          {/* Calendar dot */}
          <HStack className="items-center py-4">
            <View
              style={[styles.calendarDot, { backgroundColor: calendarColor, marginRight: 10 }]}
            />
            <Text className={calendarNameStyle({})}>{calendar?.name ?? 'Calendar'}</Text>
          </HStack>
          <View className={dividerStyle({})} />

          {/* Time */}
          <VStack className="py-4">
            <Text className={sectionLabelStyle({})}>Time</Text>
            <Text className={valueStyle({})}>
              {event.start_time && event.end_time
                ? formatEventDateTime(event.start_time, event.end_time)
                : ''}
            </Text>
          </VStack>
          <View className={dividerStyle({})} />

          {/* Busy badge */}
          <VStack className="items-start py-4">
            <View style={styles.busyBadge}>
              <Text className="text-sm text-typography-600">Busy</Text>
            </View>
          </VStack>
        </VStack>
      </ScrollView>
    </Box>
  );
}
