import { render, screen } from '@testing-library/react-native';
import { AllDayEventRow } from '../AllDayEventRow';
import type { FeedEvent } from '@hooks/useScheduleFeed';

function makeFeedEvent(overrides: Partial<FeedEvent> = {}): FeedEvent {
  return {
    id: 'evt-1',
    calendar_id: 'cal-1',
    created_by_user_id: 'user-1',
    title: 'Team Offsite',
    description: '',
    start_time: '2026-02-24T00:00:00Z',
    end_time: '2026-02-25T00:00:00Z',
    is_recurring: 0,
    deleted_at: null,
    inserted_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    calendar_name: 'Work Calendar',
    calendar_type: 'group',
    ...overrides,
  } as FeedEvent;
}

describe('AllDayEventRow', () => {
  it('renders nothing when events list is empty', () => {
    const { toJSON } = render(<AllDayEventRow events={[]} />);
    expect(toJSON()).toBeNull();
  });

  it('renders pills for each all-day event', () => {
    const events = [
      makeFeedEvent({ id: 'e1', title: 'Team Offsite' }),
      makeFeedEvent({ id: 'e2', title: 'PTO - Jane' }),
    ];
    render(<AllDayEventRow events={events} />);
    expect(screen.getByText('Team Offsite')).toBeTruthy();
    expect(screen.getByText('PTO - Jane')).toBeTruthy();
  });
});
