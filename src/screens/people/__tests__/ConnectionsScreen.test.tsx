import { fireEvent, render, waitFor } from '@testing-library/react-native';

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

const mockAccept = jest.fn();
const mockDecline = jest.fn();
const mockCancel = jest.fn();
jest.mock('@utils/connections', () => ({
  acceptConnection: (...args: unknown[]): unknown => mockAccept(...args),
  declineConnection: (...args: unknown[]): unknown => mockDecline(...args),
  cancelSentRequest: (...args: unknown[]): unknown => mockCancel(...args),
}));

const sarah = {
  id: 'c1',
  requester_id: 'them1',
  addressee_id: 'me',
  status: 'pending' as const,
  blocker_id: null,
  other_user_id: 'them1',
  first_name: 'Sarah',
  last_name: 'Chen',
  avatar_color: null,
};
const alex = {
  ...sarah,
  id: 'c2',
  requester_id: 'me',
  addressee_id: 'them2',
  status: 'accepted' as const,
  other_user_id: 'them2',
  first_name: 'Alex',
  last_name: 'Park',
};
const riley = {
  ...sarah,
  id: 'c3',
  requester_id: 'me',
  addressee_id: 'them3',
  other_user_id: 'them3',
  first_name: 'Riley',
  last_name: 'Stone',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ConnectionsScreen', () => {
  it('renders Requests section with Accept and Decline buttons', () => {
    mockUseConnections.mockReturnValue({
      pendingIncoming: [sarah],
      accepted: [],
      pendingOutgoing: [],
      isLoading: false,
    });
    const { getByText } = render(<ConnectionsScreen />);
    expect(getByText(/REQUESTS/)).toBeTruthy();
    expect(getByText('Sarah Chen')).toBeTruthy();
    expect(getByText('Accept')).toBeTruthy();
  });

  it('calls acceptConnection when Accept tapped', async () => {
    mockUseConnections.mockReturnValue({
      pendingIncoming: [sarah],
      accepted: [],
      pendingOutgoing: [],
      isLoading: false,
    });
    const { getByText } = render(<ConnectionsScreen />);
    fireEvent.press(getByText('Accept'));
    await waitFor(() => expect(mockAccept).toHaveBeenCalledWith('c1'));
  });

  it('renders Connected section; row tap navigates to PersonProfile', () => {
    mockUseConnections.mockReturnValue({
      pendingIncoming: [],
      accepted: [alex],
      pendingOutgoing: [],
      isLoading: false,
    });
    const { getByText } = render(<ConnectionsScreen />);
    expect(getByText('CONNECTED (1)')).toBeTruthy();
    fireEvent.press(getByText('Alex Park'));
    expect(mockNavigate).toHaveBeenCalledWith('PersonProfile', { userId: 'them2' });
  });

  it('renders Sent section collapsed by default, expands on tap', () => {
    mockUseConnections.mockReturnValue({
      pendingIncoming: [],
      accepted: [],
      pendingOutgoing: [riley],
      isLoading: false,
    });
    const { getByText, queryByText } = render(<ConnectionsScreen />);
    expect(getByText('SENT (1)')).toBeTruthy();
    expect(queryByText('Riley Stone')).toBeNull(); // collapsed
    fireEvent.press(getByText('SENT (1)'));
    expect(queryByText('Riley Stone')).toBeTruthy(); // expanded
  });

  it('renders the empty state with Add People CTA', () => {
    mockUseConnections.mockReturnValue({
      pendingIncoming: [],
      accepted: [],
      pendingOutgoing: [],
      isLoading: false,
    });
    const { getByText } = render(<ConnectionsScreen />);
    expect(getByText(/No connections yet/i)).toBeTruthy();
    fireEvent.press(getByText('Add People'));
    expect(mockNavigate).toHaveBeenCalledWith('AddConnection');
  });

  it('shows skeleton while isLoading', () => {
    mockUseConnections.mockReturnValue({
      pendingIncoming: [],
      accepted: [],
      pendingOutgoing: [],
      isLoading: true,
    });
    const { getAllByTestId } = render(<ConnectionsScreen />);
    expect(getAllByTestId('person-row-skeleton')).toHaveLength(3);
  });
});
