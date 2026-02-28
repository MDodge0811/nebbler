import { render, screen, fireEvent } from '@testing-library/react-native';
import { AllDayPill } from '../AllDayPill';

describe('AllDayPill', () => {
  it('renders the title', () => {
    render(<AllDayPill title="Team Offsite" calendarId="cal-1" />);
    expect(screen.getByText('Team Offsite')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const handlePress = jest.fn();
    render(<AllDayPill title="Team Offsite" calendarId="cal-1" onPress={handlePress} />);
    fireEvent.press(screen.getByLabelText('Team Offsite'));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('sets accessibility label to the title', () => {
    render(<AllDayPill title="PTO" calendarId="cal-2" />);
    expect(screen.getByLabelText('PTO')).toBeTruthy();
  });
});
