import { render, screen } from '@testing-library/react-native';
import { DateSectionHeader } from '../DateSectionHeader';

describe('DateSectionHeader', () => {
  const today = '2026-02-24';

  it('renders "Today" prefix when date matches today', () => {
    render(<DateSectionHeader dateString="2026-02-24" today={today} />);
    expect(screen.getByText(/^Today/)).toBeTruthy();
  });

  it('renders weekday for non-today dates', () => {
    render(<DateSectionHeader dateString="2026-02-25" today={today} />);
    expect(screen.getByText(/Wednesday/)).toBeTruthy();
  });

  it('includes the month and day number', () => {
    render(<DateSectionHeader dateString="2026-02-25" today={today} />);
    expect(screen.getByText(/Feb 25/)).toBeTruthy();
  });
});
