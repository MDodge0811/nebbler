import { memo } from 'react';
import { ScrollView } from 'react-native';

import { AllDayPill } from '@components/schedule/AllDayPill';
import type { FeedEvent } from '@hooks/useScheduleFeed';

interface AllDayEventRowProps {
  events: FeedEvent[];
  onEventPress?: ((event: FeedEvent) => void) | undefined;
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
      className="py-1"
      contentContainerClassName="px-4"
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
