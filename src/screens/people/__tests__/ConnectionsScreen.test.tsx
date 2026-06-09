import { fireEvent, render } from '@testing-library/react-native';

import { ConnectionsScreen } from '../ConnectionsScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockUseConnections = jest.fn();
jest.mock('@hooks/useConnections', () => ({
  useConnections: (...args: unknown[]): unknown => mockUseConnections(...args),
}));

jest.mock('@hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ user: { id: 'me' } }),
}));

const alex = {
  id: 'c1',
  other_user_id: 'them1',
  first_name: 'Alex',
  last_name: 'Park',
  avatar_color: null,
};

const riley = {
  id: 'c2',
  other_user_id: 'them2',
  first_name: 'Riley',
  last_name: 'Stone',
  avatar_color: null,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ConnectionsScreen', () => {
  it('renders Connected section with connected rows', () => {
    mockUseConnections.mockReturnValue({
      connections: [alex],
      isLoading: false,
    });
    const { getByText } = render(<ConnectionsScreen />);
    expect(getByText(/Connected \(1\)/i)).toBeTruthy();
    expect(getByText('Alex Park')).toBeTruthy();
  });

  it('row tap navigates to PersonProfile with other_user_id', () => {
    mockUseConnections.mockReturnValue({
      connections: [alex],
      isLoading: false,
    });
    const { getByText } = render(<ConnectionsScreen />);
    fireEvent.press(getByText('Alex Park'));
    expect(mockNavigate).toHaveBeenCalledWith('PersonProfile', { userId: 'them1' });
  });

  it('renders multiple connected rows', () => {
    mockUseConnections.mockReturnValue({
      connections: [alex, riley],
      isLoading: false,
    });
    const { getByText } = render(<ConnectionsScreen />);
    expect(getByText(/Connected \(2\)/i)).toBeTruthy();
    expect(getByText('Alex Park')).toBeTruthy();
    expect(getByText('Riley Stone')).toBeTruthy();
  });

  it('renders the empty state with Add People CTA when no connections', () => {
    mockUseConnections.mockReturnValue({
      connections: [],
      isLoading: false,
    });
    const { getByText } = render(<ConnectionsScreen />);
    expect(getByText(/No connections yet/i)).toBeTruthy();
    fireEvent.press(getByText('Add People'));
    expect(mockNavigate).toHaveBeenCalledWith('AddConnection');
  });

  it('shows skeleton while isLoading', () => {
    mockUseConnections.mockReturnValue({
      connections: [],
      isLoading: true,
    });
    const { getAllByTestId } = render(<ConnectionsScreen />);
    expect(getAllByTestId('person-row-skeleton')).toHaveLength(3);
  });

  it('does NOT render pending Requests or Sent sections', () => {
    mockUseConnections.mockReturnValue({
      connections: [alex],
      isLoading: false,
    });
    const { queryByText } = render(<ConnectionsScreen />);
    expect(queryByText(/Requests/i)).toBeNull();
    expect(queryByText(/Sent/i)).toBeNull();
  });
});
