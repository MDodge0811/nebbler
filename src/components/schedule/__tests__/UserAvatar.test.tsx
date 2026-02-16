import { render, screen, fireEvent } from '@testing-library/react-native';
import { UserAvatar } from '../UserAvatar';

jest.mock('@powersync/react', () => ({
  useQuery: jest.fn().mockReturnValue({ data: [], isLoading: false, error: undefined }),
}));

describe('UserAvatar', () => {
  it('renders initials from first and last name', () => {
    render(
      <UserAvatar
        userId="user-1"
        firstName="Alice"
        lastName="Smith"
        fallbackName="alice@test.com"
      />
    );
    expect(screen.getByText('AS')).toBeTruthy();
  });

  it('renders fallback initial from email when names are null', () => {
    render(<UserAvatar userId="user-1" fallbackName="bob@test.com" />);
    expect(screen.getByText('B')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const handlePress = jest.fn();
    render(<UserAvatar userId="user-1" fallbackName="test@test.com" onPress={handlePress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('renders with the correct accessibility label', () => {
    render(<UserAvatar userId="user-1" fallbackName="test@test.com" />);
    expect(screen.getByLabelText('User profile')).toBeTruthy();
  });
});
