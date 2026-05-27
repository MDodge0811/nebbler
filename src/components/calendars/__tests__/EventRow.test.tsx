import { render, fireEvent } from '@testing-library/react-native';
import { EventRow } from '../EventRow';

const ev = {
  id: 'e1',
  calendar_id: 'c1',
  title: 'Game Night',
  start_time: '2026-06-01T19:00:00Z',
  end_time: '2026-06-01T22:00:00Z',
} as any;

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
