import { render, screen } from '@testing-library/react-native';
import { AttendeeRow, type Attendee } from '../AttendeeRow';

const mockAttendees: Attendee[] = [
  { id: 'u1', firstName: 'Alice', lastName: 'Smith', displayName: 'Alice Smith' },
  { id: 'u2', firstName: 'Bob', lastName: 'Jones', displayName: 'Bob Jones' },
  { id: 'u3', firstName: 'Carol', lastName: 'Davis', displayName: 'Carol Davis' },
];

describe('AttendeeRow', () => {
  it('renders nothing when attendees list is empty', () => {
    const { toJSON } = render(<AttendeeRow attendees={[]} />);
    expect(toJSON()).toBeNull();
  });

  it('renders attendee count accessibility label', () => {
    render(<AttendeeRow attendees={mockAttendees} />);
    expect(screen.getByLabelText('3 attendees')).toBeTruthy();
  });

  it('shows overflow count when attendees exceed maxVisible', () => {
    const fiveAttendees: Attendee[] = [
      ...mockAttendees,
      { id: 'u4', firstName: 'Dan', lastName: 'Brown', displayName: 'Dan Brown' },
      { id: 'u5', firstName: 'Eve', lastName: 'White', displayName: 'Eve White' },
    ];
    render(<AttendeeRow attendees={fiveAttendees} maxVisible={3} />);
    expect(screen.getByText('+2')).toBeTruthy();
  });

  it('does not show overflow when all fit', () => {
    render(<AttendeeRow attendees={mockAttendees} maxVisible={4} />);
    expect(screen.queryByText(/\+\d/)).toBeNull();
  });
});
