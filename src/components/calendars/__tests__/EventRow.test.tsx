import { render, fireEvent } from '@testing-library/react-native';

import type { Event } from '@database/schema';

import { EventRow } from '../EventRow';

const ev: Event = {
  id: 'e1',
  calendar_id: 'c1',
  created_by_user_id: 'user-1',
  title: 'Game Night',
  description: null,
  location: null,
  start_time: '2026-06-01T19:00:00Z',
  end_time: '2026-06-01T22:00:00Z',
  show_as: 'busy',
  is_all_day: 0,
  rrule: null,
  duration_minutes: null,
  recurring_event_id: null,
  recurrence_id: null,
  exdates: null,
  deleted_at: null,
  inserted_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('EventRow', () => {
  it('shows the event title when not free/busy', () => {
    const { getByText, queryByText } = render(
      <EventRow
        event={ev}
        calendarColor="#A78BFA"
        isFreeBusy={false}
        rsvpStatus="going"
        goingCount={3}
      />
    );
    expect(getByText('Game Night')).toBeTruthy();
    expect(getByText('Going')).toBeTruthy();
    expect(getByText('3 going')).toBeTruthy();
    expect(queryByText('Busy')).toBeNull();
  });

  it('shows Busy and no RSVP when free/busy', () => {
    const { getByText, queryByText } = render(
      <EventRow event={ev} calendarColor="#A78BFA" isFreeBusy rsvpStatus="going" goingCount={5} />
    );
    expect(getByText('Busy')).toBeTruthy();
    expect(queryByText('Game Night')).toBeNull();
    expect(queryByText('Going')).toBeNull();
    expect(queryByText('5 going')).toBeNull();
  });

  it('calls onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <EventRow event={ev} calendarColor="#A78BFA" isFreeBusy={false} onPress={onPress} />
    );
    fireEvent.press(getByText('Game Night'));
    expect(onPress).toHaveBeenCalled();
  });
});
