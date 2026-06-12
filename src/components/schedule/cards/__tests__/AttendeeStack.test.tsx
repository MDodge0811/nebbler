import { render, screen } from '@testing-library/react-native';

import { AttendeeStack } from '../AttendeeStack';
import type { AttendeeChip } from '../types';

const GOING: AttendeeChip = { initials: 'AB', color: '#00DB74', rsvp: 'going' };
const PENDING: AttendeeChip = { initials: 'CD', color: '#C7C7CF', rsvp: 'pending' };

describe('AttendeeStack', () => {
  it('returns null when attendees array is empty', () => {
    const { toJSON } = render(<AttendeeStack attendees={[]} />);
    expect(toJSON()).toBeNull();
  });

  it('renders a going attendee', () => {
    render(<AttendeeStack attendees={[GOING]} />);
    expect(screen.getByLabelText('1 attendees')).toBeTruthy();
  });

  it('renders a pending attendee', () => {
    render(<AttendeeStack attendees={[PENDING]} />);
    expect(screen.getByLabelText('1 attendees')).toBeTruthy();
  });

  it('renders mixed going and pending attendees', () => {
    render(<AttendeeStack attendees={[GOING, PENDING]} />);
    expect(screen.getByLabelText('2 attendees')).toBeTruthy();
  });

  it('shows overflow count when attendees exceed maxVisible', () => {
    const many: AttendeeChip[] = [
      { initials: 'A1', color: '#F00', rsvp: 'going' },
      { initials: 'B2', color: '#0F0', rsvp: 'going' },
      { initials: 'C3', color: '#00F', rsvp: 'pending' },
      { initials: 'D4', color: '#FF0', rsvp: 'going' },
      { initials: 'E5', color: '#F0F', rsvp: 'pending' },
    ];
    render(<AttendeeStack attendees={many} maxVisible={4} />);
    expect(screen.getByText('+1')).toBeTruthy();
  });

  it('renders initials for each visible attendee', () => {
    render(<AttendeeStack attendees={[GOING, PENDING]} />);
    expect(screen.getByText('AB')).toBeTruthy();
    expect(screen.getByText('CD')).toBeTruthy();
  });
});
