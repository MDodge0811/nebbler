import { render, screen, fireEvent } from '@testing-library/react-native';
import { EventCardFull } from '../EventCardFull';
import type { FeedEvent } from '@hooks/useScheduleFeed';

function makeFeedEvent(overrides: Partial<FeedEvent> = {}): FeedEvent {
  return {
    id: 'evt-1',
    calendar_id: 'cal-1',
    created_by_user_id: 'user-1',
    title: 'Team Standup',
    description: '',
    start_time: '2026-02-24T14:00:00Z',
    end_time: '2026-02-24T15:00:00Z',
    is_recurring: 0,
    deleted_at: null,
    inserted_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    calendar_name: 'Work Calendar',
    calendar_type: 'social',
    ...overrides,
  } as FeedEvent;
}

describe('EventCardFull', () => {
  it('renders the event title', () => {
    render(<EventCardFull event={makeFeedEvent()} />);
    expect(screen.getByText('Team Standup')).toBeTruthy();
  });

  it('renders the time range', () => {
    render(<EventCardFull event={makeFeedEvent()} />);
    expect(screen.getByText(/–/)).toBeTruthy();
  });

  it('renders the calendar name', () => {
    render(<EventCardFull event={makeFeedEvent()} />);
    expect(screen.getByText('Work Calendar')).toBeTruthy();
  });

  it('calls onPress when the card is tapped', () => {
    const handlePress = jest.fn();
    render(<EventCardFull event={makeFeedEvent()} onPress={handlePress} />);
    fireEvent.press(screen.getByLabelText('Team Standup'));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('renders the meatball menu button when onMeatballPress is provided', () => {
    render(<EventCardFull event={makeFeedEvent()} onMeatballPress={jest.fn()} />);
    expect(screen.getByLabelText('More options')).toBeTruthy();
  });

  it('does not render the meatball button when onMeatballPress is not provided', () => {
    render(<EventCardFull event={makeFeedEvent()} />);
    expect(screen.queryByLabelText('More options')).toBeNull();
  });

  it('renders the calendar color dot', () => {
    render(<EventCardFull event={makeFeedEvent()} />);
    expect(screen.getByLabelText('Calendar color')).toBeTruthy();
  });
});
