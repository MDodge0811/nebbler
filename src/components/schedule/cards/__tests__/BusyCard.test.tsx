import { render, screen } from '@testing-library/react-native';

import { BusyCard } from '../BusyCard';

describe('BusyCard', () => {
  it('renders "Busy" label', () => {
    render(<BusyCard />);
    expect(screen.getByText('Busy')).toBeTruthy();
  });

  it('renders timeRange when provided', () => {
    render(<BusyCard timeRange="2:00–4:00 PM" />);
    expect(screen.getByText('2:00–4:00 PM')).toBeTruthy();
  });

  it('does not render timeRange when absent', () => {
    render(<BusyCard />);
    expect(screen.queryByText('2:00–4:00 PM')).toBeNull();
  });

  it('does not render a title or any event-specific content', () => {
    render(<BusyCard timeRange="1–2 PM" />);
    // Only "Busy" label — no title
    expect(screen.queryByLabelText('Starred')).toBeNull();
  });
});
