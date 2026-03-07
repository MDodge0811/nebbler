import { memo, type ReactNode } from 'react';
import { EventCardFull } from '@components/schedule/EventCardFull';
import { EventCardCompact } from '@components/schedule/EventCardCompact';
import { EventCardBusy } from '@components/schedule/EventCardBusy';
import type { Attendee } from '@components/schedule/AttendeeRow';
import type { FeedEvent } from '@hooks/useScheduleFeed';

export type CardDisplayMode = 'full' | 'compact' | 'busy';

interface EventCardProps {
  event: FeedEvent;
  mode?: CardDisplayMode;
  onPress?: () => void;
  onMeatballPress?: () => void;
  attendees?: Attendee[];
  footer?: ReactNode;
}

export const EventCard = memo(function EventCard({
  event,
  mode = 'full',
  onPress,
  onMeatballPress,
  attendees = [],
  footer,
}: EventCardProps) {
  if (__DEV__ && !event.calendar_id) {
    console.warn('[EventCard] Event missing calendar_id:', event.id);
  }

  switch (mode) {
    case 'compact':
      return <EventCardCompact event={event} onPress={onPress} attendees={attendees} />;
    case 'busy':
      return <EventCardBusy event={event} />;
    case 'full':
    default:
      return (
        <EventCardFull
          event={event}
          onPress={onPress}
          onMeatballPress={onMeatballPress}
          attendees={attendees}
          footer={footer}
        />
      );
  }
});
