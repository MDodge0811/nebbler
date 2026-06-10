import { render, screen } from '@testing-library/react-native';

import { QuietDayCard } from '../QuietDayCard';

describe('QuietDayCard', () => {
  it('renders "Open day" heading', () => {
    render(<QuietDayCard />);
    expect(screen.getByText('Open day')).toBeTruthy();
  });

  it('renders the breathing-room subtitle', () => {
    render(<QuietDayCard />);
    expect(screen.getByText('Breathing room. Tap + to add something.')).toBeTruthy();
  });
});
