import { render, screen, fireEvent } from '@testing-library/react-native';
import { EventCardCompact } from '../EventCardCompact';
import type { FeedEvent } from '@hooks/useScheduleFeed';

function makeFeedEvent(overrides: Partial<FeedEvent> = {}): FeedEvent {
  return {
    id: 'evt-1',
    calendar_id: 'cal-1',
    created_by_user_id: 'user-1',
    title: 'Lunch with Sarah',
    description: '',
    start_time: '2026-02-24T12:30:00Z',
    end_time: '2026-02-24T13:30:00Z',
    is_recurring: 0,
    deleted_at: null,
    inserted_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    calendar_name: 'Personal',
    calendar_type: 'private',
    ...overrides,
  } as FeedEvent;
}

describe('EventCardCompact', () => {
  it('renders the event title', () => {
    render(<EventCardCompact event={makeFeedEvent()} />);
    expect(screen.getByText('Lunch with Sarah')).toBeTruthy();
  });

  it('renders the start time', () => {
    render(<EventCardCompact event={makeFeedEvent()} />);
    // Should contain AM or PM
    expect(screen.getByText(/[AP]M/)).toBeTruthy();
  });

  it('calls onPress when the card is tapped', () => {
    const handlePress = jest.fn();
    render(<EventCardCompact event={makeFeedEvent()} onPress={handlePress} />);
    fireEvent.press(screen.getByLabelText('Lunch with Sarah'));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });
});
