import { render, screen, fireEvent } from '@testing-library/react-native';
import { MeatballMenuButton } from '../MeatballMenuButton';

describe('MeatballMenuButton', () => {
  it('calls onPress when tapped', () => {
    const handlePress = jest.fn();
    render(<MeatballMenuButton onPress={handlePress} />);
    fireEvent.press(screen.getByLabelText('More options'));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('has the correct accessibility label', () => {
    render(<MeatballMenuButton onPress={jest.fn()} />);
    expect(screen.getByLabelText('More options')).toBeTruthy();
  });
});
