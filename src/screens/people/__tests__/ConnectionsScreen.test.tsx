import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { ConnectionsScreen } from '../ConnectionsScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  // Invoke the focus callback immediately so the poll-on-open refetch runs.
  useFocusEffect: (cb: () => void) => cb(),
}));

const mockUseConnections = jest.fn();
const mockUseSharedCounts = jest.fn();
jest.mock('@hooks/useConnections', () => ({
  useConnections: (...a: unknown[]): unknown => mockUseConnections(...a),
  useSharedCalendarCounts: (...a: unknown[]): unknown => mockUseSharedCounts(...a),
}));

const mockUseRequests = jest.fn();
jest.mock('@hooks/useConnectionsApi', () => ({
  useConnectionRequests: (...a: unknown[]): unknown => mockUseRequests(...a),
  useResolveRequest: () => ({}),
}));

const mockRun = jest.fn();
const mockUseOnlineAction = jest.fn();
jest.mock('@hooks/useOnlineAction', () => ({
  useOnlineAction: (...a: unknown[]): unknown => mockUseOnlineAction(...a),
}));

jest.mock('@hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ user: { id: 'me' } }),
}));

const mockShow = jest.fn();
jest.mock('@/components/ui/toast', () => ({
  useToast: () => ({ show: mockShow }),
}));

const alex = {
  id: 'c1',
  other_user_id: 'them1',
  username: 'alex',
  first_name: 'Alex',
  last_name: 'Park',
  avatar_color: null,
};

const incomingItem = {
  id: 'req-in',
  user: {
    id: 'them3',
    username: 'emma',
    first_name: 'Emma',
    last_name: 'Wilson',
    avatar_color: null,
  },
  requested_at: '2026-06-09T00:00:00Z',
};
const outgoingItem = {
  id: 'req-out',
  user: {
    id: 'them4',
    username: 'olivia',
    first_name: 'Olivia',
    last_name: 'Nguyen',
    avatar_color: null,
  },
  requested_at: '2026-06-09T00:00:00Z',
};

function setup(
  overrides: {
    connections?: unknown[];
    isLoading?: boolean;
    incoming?: unknown[];
    outgoing?: unknown[];
    isConnected?: boolean;
    sharedCounts?: Record<string, number>;
  } = {}
) {
  mockUseConnections.mockReturnValue({
    connections: overrides.connections ?? [alex],
    isLoading: overrides.isLoading ?? false,
  });
  mockUseSharedCounts.mockReturnValue(overrides.sharedCounts ?? { them1: 2 });
  mockUseRequests.mockReturnValue({
    data: { incoming: overrides.incoming ?? [], outgoing: overrides.outgoing ?? [] },
    refetch: jest.fn().mockResolvedValue(undefined),
  });
  mockUseOnlineAction.mockReturnValue({
    run: mockRun,
    isPending: false,
    isConnected: overrides.isConnected ?? true,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRun.mockResolvedValue({ status: 'success' });
});

describe('ConnectionsScreen', () => {
  it('renders connected rows with @username · N shared subtitle (synced, offline)', () => {
    setup();
    const { getByText } = render(<ConnectionsScreen />);
    expect(getByText('Alex Park')).toBeTruthy();
    expect(getByText('@alex · 2 shared')).toBeTruthy();
  });

  it('navigates to PersonProfile with other_user_id on row tap', () => {
    setup();
    const { getByText } = render(<ConnectionsScreen />);
    fireEvent.press(getByText('Alex Park'));
    expect(mockNavigate).toHaveBeenCalledWith('PersonProfile', { userId: 'them1' });
  });

  it('add button navigates to AddConnection', () => {
    setup();
    const { getByLabelText } = render(<ConnectionsScreen />);
    fireEvent.press(getByLabelText('Add connection'));
    expect(mockNavigate).toHaveBeenCalledWith('AddConnection');
  });

  it('renders incoming pending requests from the REST list and accepts via the resolve client', () => {
    setup({ incoming: [incomingItem] });
    const { getByText } = render(<ConnectionsScreen />);
    expect(getByText('Pending Requests')).toBeTruthy();
    expect(getByText('Emma Wilson')).toBeTruthy();
    fireEvent.press(getByText('Accept'));
    expect(mockRun).toHaveBeenCalledWith({ id: 'req-in', status: 'accepted' });
  });

  it('declines an incoming request', () => {
    setup({ incoming: [incomingItem] });
    const { getByText } = render(<ConnectionsScreen />);
    fireEvent.press(getByText('Decline'));
    expect(mockRun).toHaveBeenCalledWith({ id: 'req-in', status: 'declined' });
  });

  it('surfaces an error toast when a resolve fails (no local write)', async () => {
    setup({ incoming: [incomingItem] });
    mockRun.mockResolvedValueOnce({ status: 'error', message: 'Nope' });
    const { getByText } = render(<ConnectionsScreen />);
    fireEvent.press(getByText('Accept'));
    await waitFor(() =>
      expect(mockShow).toHaveBeenCalledWith(expect.objectContaining({ title: 'Nope' }))
    );
  });

  it('disables responses and shows an offline note when disconnected', () => {
    setup({ incoming: [incomingItem], isConnected: false });
    const { getByText } = render(<ConnectionsScreen />);
    expect(getByText(/You're offline/i)).toBeTruthy();
    fireEvent.press(getByText('Accept'));
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('expands Sent Requests and cancels an outgoing request', () => {
    setup({ outgoing: [outgoingItem] });
    const { getByText, queryByText } = render(<ConnectionsScreen />);
    expect(queryByText('Olivia Nguyen')).toBeNull(); // collapsed by default
    fireEvent.press(getByText('Sent Requests'));
    expect(getByText('Olivia Nguyen')).toBeTruthy();
    fireEvent.press(getByText('Cancel'));
    expect(mockRun).toHaveBeenCalledWith({ id: 'req-out', status: 'cancelled' });
  });

  it('renders the empty state with a Find People CTA when there are no connections', () => {
    setup({ connections: [] });
    const { getByText } = render(<ConnectionsScreen />);
    expect(getByText(/No connections yet/i)).toBeTruthy();
    fireEvent.press(getByText('Find People'));
    expect(mockNavigate).toHaveBeenCalledWith('AddConnection');
  });

  it('shows skeletons while the synced list is loading', () => {
    setup({ isLoading: true, connections: [] });
    const { getAllByTestId } = render(<ConnectionsScreen />);
    expect(getAllByTestId('person-row-skeleton')).toHaveLength(3);
  });

  it('filters the connected list by the search query', () => {
    setup({ connections: [alex] });
    const { getByPlaceholderText, queryByText } = render(<ConnectionsScreen />);
    fireEvent.changeText(getByPlaceholderText('Search connections…'), 'zzz');
    expect(queryByText('Alex Park')).toBeNull();
  });
});
