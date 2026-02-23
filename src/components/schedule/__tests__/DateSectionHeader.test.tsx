import { render, screen } from '@testing-library/react-native';
import { DateSectionHeader } from '../DateSectionHeader';
import { useScheduleStore } from '@stores/useScheduleStore';

describe('DateSectionHeader', () => {
  beforeEach(() => {
    useScheduleStore.setState({ today: '2026-02-24' });
  });

  it('renders "Today" prefix when date matches today', () => {
    render(<DateSectionHeader dateString="2026-02-24" />);
    expect(screen.getByText(/^Today/)).toBeTruthy();
  });

  it('renders weekday for non-today dates', () => {
    render(<DateSectionHeader dateString="2026-02-25" />);
    expect(screen.getByText(/Wednesday/)).toBeTruthy();
  });

  it('includes the month and day number', () => {
    render(<DateSectionHeader dateString="2026-02-25" />);
    expect(screen.getByText(/Feb 25/)).toBeTruthy();
  });
});
