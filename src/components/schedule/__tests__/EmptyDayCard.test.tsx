import { render, screen } from '@testing-library/react-native';
import { EmptyDayCard } from '../EmptyDayCard';

describe('EmptyDayCard', () => {
  it('renders the empty state message', () => {
    render(<EmptyDayCard />);
    expect(screen.getByText('Nothing on the schedule')).toBeTruthy();
  });

  it('renders the hint to create an event', () => {
    render(<EmptyDayCard />);
    expect(screen.getByText('Hit + to add something')).toBeTruthy();
  });
});
