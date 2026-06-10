import { render, screen, fireEvent } from '@testing-library/react-native';

import { EventCardFull } from '../EventCardFull';
import type { AttendeeChip } from '../types';

const TINT = '#F472B6';

const ATTENDEES: AttendeeChip[] = [
  { initials: 'AB', color: '#00DB74', rsvp: 'going' },
  { initials: 'CD', color: '#A855F7', rsvp: 'pending' },
];

describe('EventCardFull', () => {
  it('renders title and timeRange', () => {
    render(<EventCardFull title="Book Club" timeRange="7:00–9:00 PM" tintColor={TINT} />);
    expect(screen.getByText('Book Club')).toBeTruthy();
    expect(screen.getByText('7:00–9:00 PM')).toBeTruthy();
  });

  it('renders a minimal card with only required props', () => {
    render(<EventCardFull title="Minimal" timeRange="" tintColor={TINT} />);
    expect(screen.getByText('Minimal')).toBeTruthy();
  });

  it('renders star indicator when starred=true', () => {
    render(<EventCardFull title="Book Club Starred" timeRange="9 AM" tintColor={TINT} starred />);
    expect(screen.getByLabelText('Starred')).toBeTruthy();
  });

  it('does not render star indicator when starred is absent', () => {
    render(<EventCardFull title="No Star" timeRange="9 AM" tintColor={TINT} />);
    expect(screen.queryByLabelText('Starred')).toBeNull();
  });

  it('renders location when provided', () => {
    render(
      <EventCardFull title="Lunch" timeRange="12–1 PM" tintColor={TINT} location="Central Park" />
    );
    expect(screen.getByText('Central Park')).toBeTruthy();
  });

  it('does not render location when absent', () => {
    render(<EventCardFull title="Lunch" timeRange="12–1 PM" tintColor={TINT} />);
    expect(screen.queryByText('Central Park')).toBeNull();
  });

  it('renders attendees when provided', () => {
    render(<EventCardFull title="Party" timeRange="8 PM" tintColor={TINT} attendees={ATTENDEES} />);
    expect(screen.getByLabelText('2 attendees')).toBeTruthy();
  });

  it('does not render attendees when absent', () => {
    render(<EventCardFull title="Solo" timeRange="8 PM" tintColor={TINT} />);
    expect(screen.queryByLabelText('2 attendees')).toBeNull();
  });

  it('renders "going" attendee correctly within the stack', () => {
    const goingOnly: AttendeeChip[] = [{ initials: 'MK', color: '#00DB74', rsvp: 'going' }];
    render(
      <EventCardFull title="Event" timeRange="10 AM" tintColor={TINT} attendees={goingOnly} />
    );
    expect(screen.getByLabelText('1 attendees')).toBeTruthy();
  });

  it('renders "pending" attendee correctly within the stack', () => {
    const pendingOnly: AttendeeChip[] = [{ initials: 'ZZ', color: '#C7C7CF', rsvp: 'pending' }];
    render(
      <EventCardFull title="Event" timeRange="10 AM" tintColor={TINT} attendees={pendingOnly} />
    );
    expect(screen.getByLabelText('1 attendees')).toBeTruthy();
  });

  it('renders comment chip when commentCount > 0', () => {
    render(<EventCardFull title="Chat" timeRange="3 PM" tintColor={TINT} commentCount={3} />);
    expect(screen.getByLabelText('3 comments')).toBeTruthy();
  });

  it('does not render comment chip when commentCount is 0', () => {
    render(<EventCardFull title="Silent" timeRange="3 PM" tintColor={TINT} commentCount={0} />);
    expect(screen.queryByLabelText(/comment/)).toBeNull();
  });

  it('does not render comment chip when commentCount is absent', () => {
    render(<EventCardFull title="Silent" timeRange="3 PM" tintColor={TINT} />);
    expect(screen.queryByLabelText(/comment/)).toBeNull();
  });

  it('renders unread comment chip with correct label', () => {
    render(
      <EventCardFull
        title="Chat"
        timeRange="3 PM"
        tintColor={TINT}
        commentCount={2}
        hasUnreadComments
      />
    );
    expect(screen.getByLabelText('2 comments, unread')).toBeTruthy();
  });

  it('renders photo slot when photoUri is provided', () => {
    render(
      <EventCardFull
        title="Photo"
        timeRange="5 PM"
        tintColor={TINT}
        photoUri="https://example.com/photo.jpg"
      />
    );
    expect(screen.getByLabelText('Event photo')).toBeTruthy();
  });

  it('does not render photo slot when photoUri is absent', () => {
    render(<EventCardFull title="No Photo" timeRange="5 PM" tintColor={TINT} />);
    expect(screen.queryByLabelText('Event photo')).toBeNull();
  });

  it('calls onPress when card is tapped', () => {
    const onPress = jest.fn();
    render(<EventCardFull title="Pressable" timeRange="1 PM" tintColor={TINT} onPress={onPress} />);
    fireEvent.press(screen.getByLabelText('Pressable'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onLongPress when card is long-pressed', () => {
    const onLongPress = jest.fn();
    render(
      <EventCardFull
        title="LongPress"
        timeRange="1 PM"
        tintColor={TINT}
        onLongPress={onLongPress}
      />
    );
    fireEvent(screen.getByLabelText('LongPress'), 'longPress');
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });
});
