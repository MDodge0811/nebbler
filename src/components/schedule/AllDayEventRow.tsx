import { memo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { AllDayPill } from '@components/schedule/AllDayPill';
import type { FeedEvent } from '@hooks/useScheduleFeed';

interface AllDayEventRowProps {
  events: FeedEvent[];
  onEventPress?: (event: FeedEvent) => void;
}

export const AllDayEventRow = memo(function AllDayEventRow({
  events,
  onEventPress,
}: AllDayEventRowProps) {
  if (events.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {events.map((event) => (
        <AllDayPill
          key={event.id}
          title={event.title ?? ''}
          calendarId={event.calendar_id ?? ''}
          onPress={() => onEventPress?.(event)}
        />
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  content: {
    paddingHorizontal: 16,
  },
});
