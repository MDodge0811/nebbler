import { render, screen } from '@testing-library/react-native';
import { EventCardBusy } from '../EventCardBusy';
import type { FeedEvent } from '@hooks/useScheduleFeed';

function makeFeedEvent(overrides: Partial<FeedEvent> = {}): FeedEvent {
  return {
    id: 'evt-1',
    calendar_id: 'cal-1',
    created_by_user_id: 'user-1',
    title: 'Private Meeting',
    description: '',
    start_time: '2026-02-24T14:00:00Z',
    end_time: '2026-02-24T15:00:00Z',
    is_recurring: 0,
    deleted_at: null,
    inserted_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    calendar_name: 'Work Calendar',
    calendar_type: 'group',
    ...overrides,
  } as FeedEvent;
}

describe('EventCardBusy', () => {
  it('renders "Busy" label', () => {
    render(<EventCardBusy event={makeFeedEvent()} />);
    expect(screen.getByText('Busy')).toBeTruthy();
  });

  it('renders the calendar name', () => {
    render(<EventCardBusy event={makeFeedEvent()} />);
    expect(screen.getByText('Work Calendar')).toBeTruthy();
  });

  it('does not render the event title', () => {
    render(<EventCardBusy event={makeFeedEvent()} />);
    expect(screen.queryByText('Private Meeting')).toBeNull();
  });

  it('renders the calendar color dot', () => {
    render(<EventCardBusy event={makeFeedEvent()} />);
    expect(screen.getByLabelText('Calendar color')).toBeTruthy();
  });
});
