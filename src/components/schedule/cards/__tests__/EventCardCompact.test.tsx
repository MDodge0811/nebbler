import { render, screen, fireEvent } from '@testing-library/react-native';

import { EventCardCompact } from '../EventCardCompact';

const TINT = '#00B0DB';

describe('EventCardCompact', () => {
  it('renders title and timeRange', () => {
    render(<EventCardCompact title="Quick Sync" timeRange="10:00 AM" tintColor={TINT} />);
    expect(screen.getByText('Quick Sync')).toBeTruthy();
    expect(screen.getByText('10:00 AM')).toBeTruthy();
  });

  it('renders a minimal card with empty timeRange', () => {
    render(<EventCardCompact title="Minimal" timeRange="" tintColor={TINT} />);
    expect(screen.getByText('Minimal')).toBeTruthy();
  });

  it('does not render timeRange text when empty', () => {
    render(<EventCardCompact title="No Time" timeRange="" tintColor={TINT} />);
    expect(screen.queryByText('')).toBeNull();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(
      <EventCardCompact title="Pressable" timeRange="2 PM" tintColor={TINT} onPress={onPress} />
    );
    fireEvent.press(screen.getByLabelText('Pressable'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onLongPress when long-pressed', () => {
    const onLongPress = jest.fn();
    render(
      <EventCardCompact
        title="LongPress"
        timeRange="2 PM"
        tintColor={TINT}
        onLongPress={onLongPress}
      />
    );
    fireEvent(screen.getByLabelText('LongPress'), 'longPress');
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });
});
