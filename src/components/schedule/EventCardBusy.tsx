import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet } from 'react-native';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { FeedEvent } from '@hooks/useScheduleFeed';
import { getCalendarColor } from '@utils/calendarColor';

const cardStyle = tva({
  base: 'mx-4 mb-3 overflow-hidden rounded-xl border-[0.5px] border-outline-200 shadow-sm',
});
const bodyStyle = tva({ base: 'items-center px-4 py-4' });
const busyLabel = tva({ base: 'text-lg font-bold text-typography-400' });
const calendarNameStyle = tva({ base: 'text-xs text-typography-400' });
const calendarIndicatorStyle = tva({ base: 'mt-2 items-center gap-2' });

interface EventCardBusyProps {
  event: FeedEvent;
}

export const EventCardBusy = memo(function EventCardBusy({ event }: EventCardBusyProps) {
  const color = getCalendarColor(event.calendar_id ?? '');

  return (
    <Box className={cardStyle({})}>
      {/* Frosted gradient header */}
      <Box className="relative min-h-12">
        <LinearGradient
          colors={[color + '66', color + '33']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Box>

      {/* Body */}
      <VStack className={bodyStyle({})}>
        <Text className={busyLabel({})}>Busy</Text>
        <HStack className={calendarIndicatorStyle({})}>
          <DynamicColorView
            className="h-2 w-2 rounded-full"
            backgroundColor={color}
            accessibilityLabel="Calendar color"
          />
          <Text className={calendarNameStyle({})}>{event.calendar_name}</Text>
        </HStack>
      </VStack>
    </Box>
  );
});
