import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { EventCard } from '../EventCard';
import type { FeedEvent } from '@hooks/useScheduleFeed';

function makeFeedEvent(overrides: Partial<FeedEvent> = {}): FeedEvent {
  return {
    id: 'evt-1',
    calendar_id: 'cal-1',
    created_by_user_id: 'user-1',
    title: 'Book Club',
    description: '',
    start_time: '2026-02-24T14:00:00Z',
    end_time: '2026-02-24T16:00:00Z',
    is_recurring: 0,
    deleted_at: null,
    inserted_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    calendar_name: 'Friends Calendar',
    calendar_type: 'group',
    ...overrides,
  } as FeedEvent;
}

describe('EventCard', () => {
  it('renders the event title', () => {
    render(<EventCard event={makeFeedEvent()} />);
    expect(screen.getByText('Book Club')).toBeTruthy();
  });

  it('renders the calendar name', () => {
    render(<EventCard event={makeFeedEvent()} />);
    expect(screen.getByText('Friends Calendar')).toBeTruthy();
  });

  it('renders a time range', () => {
    render(<EventCard event={makeFeedEvent()} />);
    // The formatted time will contain an en-dash separator
    const timeText = screen.getByText(/–/);
    expect(timeText).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const handlePress = jest.fn();
    render(<EventCard event={makeFeedEvent()} onPress={handlePress} />);
    fireEvent.press(screen.getByLabelText('Book Club'));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('renders a footer when provided', () => {
    render(<EventCard event={makeFeedEvent()} footer={<Text>Footer Content</Text>} />);
    expect(screen.getByText('Footer Content')).toBeTruthy();
  });

  it('renders the calendar color dot', () => {
    render(<EventCard event={makeFeedEvent()} />);
    expect(screen.getByLabelText('Calendar color')).toBeTruthy();
  });
});
