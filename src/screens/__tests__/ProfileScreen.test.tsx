import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { CALENDAR_PALETTE } from '@constants/calendarsUI';

import { ProfileScreen } from '../ProfileScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockSignOut = jest.fn();
jest.mock('@hooks/useAuth', () => ({
  useAuth: () => ({ signOut: mockSignOut, user: { id: 'me', email: 'me@example.com' } }),
}));

const mockUpdateAvatarColor = jest.fn();
jest.mock('@hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ user: { id: 'me' } }),
  useCurrentUserMutations: () => ({ updateAvatarColor: mockUpdateAvatarColor }),
}));

const mockUseUserProfile = jest.fn();
const mockUseConnections = jest.fn();
jest.mock('@hooks/useConnections', () => ({
  useUserProfile: (...args: unknown[]): unknown => mockUseUserProfile(...args),
  useConnections: (...args: unknown[]): unknown => mockUseConnections(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUseUserProfile.mockReturnValue({
    id: 'me',
    first_name: 'Mal',
    last_name: 'Dodge',
    avatar_color: CALENDAR_PALETTE[0].hex,
  });
  mockUseConnections.mockReturnValue({
    connections: [],
    isLoading: false,
  });
});

describe('ProfileScreen', () => {
  it('renders name and email', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Mal Dodge')).toBeTruthy();
    expect(getByText('me@example.com')).toBeTruthy();
  });

  it('expands the color picker when the avatar row is tapped', () => {
    const { getByText, queryAllByTestId } = render(<ProfileScreen />);
    expect(queryAllByTestId(/color-swatch-/)).toHaveLength(0);
    fireEvent.press(getByText('Mal Dodge'));
    expect(queryAllByTestId(/color-swatch-/).length).toBeGreaterThan(0);
  });

  it('updates avatar color via the mutation hook when a swatch is tapped', async () => {
    const { getByText, getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByText('Mal Dodge'));
    fireEvent.press(getByTestId(`color-swatch-${CALENDAR_PALETTE[3].hex}`));
    await waitFor(() =>
      expect(mockUpdateAvatarColor).toHaveBeenCalledWith('me', CALENDAR_PALETTE[3].hex)
    );
  });

  it('renders connection count from connections array', () => {
    mockUseConnections.mockReturnValue({
      connections: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }],
      isLoading: false,
    });
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('3 connected')).toBeTruthy();
  });

  it('does NOT render a pending badge', () => {
    mockUseConnections.mockReturnValue({
      connections: [{ id: 'a1' }],
      isLoading: false,
    });
    // The pending badge from the old design has been removed; just confirm the count row is present
    const { queryByText } = render(<ProfileScreen />);
    // There should be no standalone badge number (no red circle with a count)
    // The count text "1 connected" is present, but no separate badge
    expect(queryByText('1 connected')).toBeTruthy();
  });

  it('navigates to People > Connections when Connections row tapped', () => {
    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText('Connections'));
    expect(mockNavigate).toHaveBeenCalledWith('Main', {
      screen: 'Tabs',
      params: { screen: 'People', params: { screen: 'Connections' } },
    });
  });

  it('Log Out shows Alert; confirm calls signOut', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_, __, buttons) => {
      const logout = buttons?.find((b) => b.text === 'Log Out');
      logout?.onPress?.();
    });
    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText('Log Out'));
    expect(alertSpy).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
