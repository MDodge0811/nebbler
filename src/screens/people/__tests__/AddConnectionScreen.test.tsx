import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { RateLimitedError } from '@utils/userSearch';

import { AddConnectionScreen } from '../AddConnectionScreen';

jest.useFakeTimers();

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockSearchUsers = jest.fn();
jest.mock('@utils/userSearch', () => {
  class MockRateLimitedError extends Error {
    retryAfterSeconds: number;
    constructor(s: number) {
      super('rate limited');
      this.retryAfterSeconds = s;
    }
  }
  return {
    searchUsers: (...args: unknown[]): unknown => mockSearchUsers(...args),
    RateLimitedError: MockRateLimitedError,
  };
});

const mockUseConnections = jest.fn();
jest.mock('@hooks/useConnections', () => ({
  useConnections: (...args: unknown[]): unknown => mockUseConnections(...args),
}));

jest.mock('@hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ user: { id: 'me' } }),
}));

const mockSend = jest.fn();
const mockAccept = jest.fn();
jest.mock('@utils/connections', () => ({
  sendConnectionRequest: (...args: unknown[]): unknown => mockSend(...args),
  acceptConnection: (...args: unknown[]): unknown => mockAccept(...args),
}));

const mockShowToast = jest.fn();
jest.mock('@/components/ui/toast', () => ({
  useToast: () => ({ show: (opts: unknown): unknown => mockShowToast(opts) }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUseConnections.mockReturnValue({
    pendingIncoming: [],
    accepted: [],
    pendingOutgoing: [],
    isLoading: false,
  });
});

function typeQuery(
  getByPlaceholderText: ReturnType<typeof render>['getByPlaceholderText'],
  q: string
) {
  fireEvent.changeText(getByPlaceholderText(/Search by name or email/i), q);
  act(() => {
    jest.advanceTimersByTime(300);
  });
}

describe('AddConnectionScreen', () => {
  it('shows the prompt when query is empty', () => {
    const { getByText } = render(<AddConnectionScreen />);
    expect(getByText(/Search by name or email/i)).toBeTruthy();
  });

  it('debounces the search and calls searchUsers after 300ms', async () => {
    mockSearchUsers.mockResolvedValue([]);
    const { getByPlaceholderText } = render(<AddConnectionScreen />);
    fireEvent.changeText(getByPlaceholderText(/Search by name or email/i), 'sa');
    expect(mockSearchUsers).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => expect(mockSearchUsers).toHaveBeenCalledWith('sa'));
  });

  it('renders Connect chip for a user with no connection', async () => {
    mockSearchUsers.mockResolvedValue([
      { id: 'u1', first_name: 'Sarah', last_name: 'Chen', avatar_color: null },
    ]);
    const { getByPlaceholderText, findByText } = render(<AddConnectionScreen />);
    typeQuery(getByPlaceholderText, 'sa');
    expect(await findByText('Connect')).toBeTruthy();
  });

  it('renders Connected chip when accepted', async () => {
    mockUseConnections.mockReturnValue({
      pendingIncoming: [],
      accepted: [
        {
          id: 'c1',
          requester_id: 'me',
          addressee_id: 'u1',
          status: 'accepted',
          other_user_id: 'u1',
        },
      ],
      pendingOutgoing: [],
      isLoading: false,
    });
    mockSearchUsers.mockResolvedValue([
      { id: 'u1', first_name: 'Sarah', last_name: 'Chen', avatar_color: null },
    ]);
    const { getByPlaceholderText, findByText } = render(<AddConnectionScreen />);
    typeQuery(getByPlaceholderText, 'sa');
    expect(await findByText('Connected')).toBeTruthy();
  });

  it('renders Pending chip for outgoing requests', async () => {
    mockUseConnections.mockReturnValue({
      pendingIncoming: [],
      accepted: [],
      pendingOutgoing: [
        {
          id: 'c2',
          requester_id: 'me',
          addressee_id: 'u1',
          status: 'pending',
          other_user_id: 'u1',
        },
      ],
      isLoading: false,
    });
    mockSearchUsers.mockResolvedValue([
      { id: 'u1', first_name: 'Sarah', last_name: 'Chen', avatar_color: null },
    ]);
    const { getByPlaceholderText, findByText } = render(<AddConnectionScreen />);
    typeQuery(getByPlaceholderText, 'sa');
    expect(await findByText('Pending')).toBeTruthy();
  });

  it('renders Accept chip for incoming requests; tap accepts the connection', async () => {
    mockUseConnections.mockReturnValue({
      pendingIncoming: [
        {
          id: 'c3',
          requester_id: 'u1',
          addressee_id: 'me',
          status: 'pending',
          other_user_id: 'u1',
        },
      ],
      accepted: [],
      pendingOutgoing: [],
      isLoading: false,
    });
    mockSearchUsers.mockResolvedValue([
      { id: 'u1', first_name: 'Sarah', last_name: 'Chen', avatar_color: null },
    ]);
    const { getByPlaceholderText, findByText } = render(<AddConnectionScreen />);
    typeQuery(getByPlaceholderText, 'sa');
    fireEvent.press(await findByText('Accept'));
    await waitFor(() => expect(mockAccept).toHaveBeenCalledWith('c3'));
  });

  it('calls sendConnectionRequest with (addresseeId, requesterId) on Connect tap', async () => {
    mockSearchUsers.mockResolvedValue([
      { id: 'u1', first_name: 'Sarah', last_name: 'Chen', avatar_color: null },
    ]);
    const { getByPlaceholderText, findByText } = render(<AddConnectionScreen />);
    typeQuery(getByPlaceholderText, 'sa');
    fireEvent.press(await findByText('Connect'));
    await waitFor(() => expect(mockSend).toHaveBeenCalledWith('u1', 'me'));
  });

  it('shows a toast on RateLimitedError', async () => {
    mockSearchUsers.mockRejectedValue(new RateLimitedError(60));
    const { getByPlaceholderText } = render(<AddConnectionScreen />);
    typeQuery(getByPlaceholderText, 'sa');
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ id: 'rate-limited' }))
    );
  });

  it('shows a generic toast on other errors', async () => {
    mockSearchUsers.mockRejectedValue(new Error('boom'));
    const { getByPlaceholderText } = render(<AddConnectionScreen />);
    typeQuery(getByPlaceholderText, 'sa');
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ id: 'search-error' }))
    );
  });

  it('row tap navigates to PersonProfile', async () => {
    mockSearchUsers.mockResolvedValue([
      { id: 'u1', first_name: 'Sarah', last_name: 'Chen', avatar_color: null },
    ]);
    const { getByPlaceholderText, findByText } = render(<AddConnectionScreen />);
    typeQuery(getByPlaceholderText, 'sa');
    fireEvent.press(await findByText('Sarah Chen'));
    expect(mockNavigate).toHaveBeenCalledWith('PersonProfile', { userId: 'u1' });
  });
});
