import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { AddConnectionScreen } from '../AddConnectionScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

// Identity debounce so query state drives the search synchronously in tests.
jest.mock('@hooks/useDebouncedValue', () => ({
  useDebouncedValue: (v: string) => v,
}));

const mockRefetch = jest.fn().mockResolvedValue(undefined);
const mockUseUserSearch = jest.fn();
jest.mock('@hooks/useUserSearch', () => ({
  useUserSearch: (...a: unknown[]): unknown => mockUseUserSearch(...a),
}));

jest.mock('@hooks/useConnectionsApi', () => ({
  useSendRequest: () => ({}),
  useResolveRequest: () => ({}),
}));

const mockRun = jest.fn();
jest.mock('@hooks/useOnlineAction', () => ({
  useOnlineAction: () => ({ run: mockRun, isPending: false, isConnected: mockIsConnected }),
}));
let mockIsConnected = true;

const mockShow = jest.fn();
jest.mock('@/components/ui/toast', () => ({
  useToast: () => ({ show: mockShow }),
}));

function user(id: string, username: string, first: string, state: string, extra = {}) {
  return {
    id,
    username,
    first_name: first,
    last_name: 'X',
    avatar_color: null,
    relationship: { state, request_id: null, connection_id: null, ...extra },
  };
}

function setSearch(over: { data?: unknown[]; isFetching?: boolean; error?: unknown } = {}) {
  mockUseUserSearch.mockReturnValue({
    data: over.data ?? [],
    isFetching: over.isFetching ?? false,
    error: over.error,
    refetch: mockRefetch,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockIsConnected = true;
  mockRun.mockResolvedValue({ status: 'success' });
  setSearch();
});

function typeQuery(api: ReturnType<typeof render>, text: string) {
  fireEvent.changeText(api.getByPlaceholderText('Search by name or @username'), text);
}

describe('AddConnectionScreen', () => {
  it('shows the pre-search prompt for a short query', () => {
    const api = render(<AddConnectionScreen />);
    expect(api.getByText('Search by name or @username')).toBeTruthy();
  });

  it('renders results with @username and a Connect action for non-connected users', () => {
    setSearch({ data: [user('u1', 'alice', 'Alice', 'none')] });
    const api = render(<AddConnectionScreen />);
    typeQuery(api, 'alice');
    expect(api.getByText('Alice X')).toBeTruthy();
    expect(api.getByText('@alice')).toBeTruthy();
    expect(api.getByText('Connect')).toBeTruthy();
  });

  it('Connect posts a request via the send client and refetches search', async () => {
    setSearch({ data: [user('u1', 'alice', 'Alice', 'none')] });
    const api = render(<AddConnectionScreen />);
    typeQuery(api, 'alice');
    fireEvent.press(api.getByText('Connect'));
    expect(mockRun).toHaveBeenCalledWith('u1');
    await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
  });

  it('shows Accept (not Connect) for an incoming_pending relationship and accepts via request_id', () => {
    setSearch({
      data: [user('u2', 'emma', 'Emma', 'incoming_pending', { request_id: 'req-9' })],
    });
    const api = render(<AddConnectionScreen />);
    typeQuery(api, 'emma');
    expect(api.queryByText('Connect')).toBeNull();
    fireEvent.press(api.getByText('Accept'));
    expect(mockRun).toHaveBeenCalledWith({ id: 'req-9', status: 'accepted' });
  });

  it('renders Pending / Connected chips for the respective states', () => {
    setSearch({
      data: [
        user('u3', 'olivia', 'Olivia', 'outgoing_pending', { request_id: 'r1' }),
        user('u4', 'sarah', 'Sarah', 'connected', { connection_id: 'c1' }),
      ],
    });
    const api = render(<AddConnectionScreen />);
    typeQuery(api, 's');
    typeQuery(api, 'search');
    expect(api.getByText('Pending')).toBeTruthy();
    expect(api.getByText('Connected')).toBeTruthy();
  });

  it('treats 409 inbound_request_exists as an Accept handoff, not an error', async () => {
    setSearch({ data: [user('u1', 'alice', 'Alice', 'none')] });
    mockRun.mockResolvedValueOnce({
      status: 'error',
      message: 'They already sent you a request — accept it instead.',
      error: { code: 'inbound_request_exists' },
    });
    const api = render(<AddConnectionScreen />);
    typeQuery(api, 'alice');
    fireEvent.press(api.getByText('Connect'));
    await waitFor(() =>
      expect(mockShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'They already sent you a request — accept it below.' })
      )
    );
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('disables Connect when offline', () => {
    mockIsConnected = false;
    setSearch({ data: [user('u1', 'alice', 'Alice', 'none')] });
    const api = render(<AddConnectionScreen />);
    typeQuery(api, 'alice');
    fireEvent.press(api.getByText('Connect'));
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('navigates to PersonProfile on row tap', () => {
    setSearch({ data: [user('u1', 'alice', 'Alice', 'none')] });
    const api = render(<AddConnectionScreen />);
    typeQuery(api, 'alice');
    fireEvent.press(api.getByText('Alice X'));
    expect(mockNavigate).toHaveBeenCalledWith('PersonProfile', { userId: 'u1' });
  });

  it('toasts a rate-limit message when search returns a RateLimitedError', async () => {
    const err = new Error('rate limited');
    err.name = 'RateLimitedError';
    setSearch({ error: err });
    render(<AddConnectionScreen />);
    await waitFor(() =>
      expect(mockShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Slow down a moment — try again in a few seconds.' })
      )
    );
  });
});
