import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { getCalendarColor } from '@utils/calendarColor';
import type { FeedEvent } from '@hooks/useScheduleFeed';

const cardStyle = tva({ base: 'mx-4 mb-3 overflow-hidden rounded-xl shadow-sm' });
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
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={[color + '66', color + '33']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      </View>

      {/* Body */}
      <VStack className={bodyStyle({})}>
        <Text className={busyLabel({})}>Busy</Text>
        <HStack className={calendarIndicatorStyle({})}>
          <View
            style={[styles.calendarDot, { backgroundColor: color }]}
            accessibilityLabel="Calendar color"
          />
          <Text className={calendarNameStyle({})}>{event.calendar_name}</Text>
        </HStack>
      </VStack>
    </Box>
  );
});

const styles = StyleSheet.create({
  headerContainer: {
    minHeight: 48,
    position: 'relative',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  calendarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
