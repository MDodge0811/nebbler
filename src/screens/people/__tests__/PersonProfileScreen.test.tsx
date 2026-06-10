import { fireEvent, render } from '@testing-library/react-native';

import { PersonProfileScreen } from '../PersonProfileScreen';

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockSetOptions = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate, setOptions: mockSetOptions }),
  useRoute: () => ({ params: { userId: 'them' } }),
}));

jest.mock('@hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ user: { id: 'me' } }),
}));

const mockUseUserProfile = jest.fn();
const mockUseConnectionWith = jest.fn();
const mockUseSharedCalendars = jest.fn();
const mockUseSharedCalendarCount = jest.fn();
jest.mock('@hooks/useConnections', () => ({
  useUserProfile: (...a: unknown[]): unknown => mockUseUserProfile(...a),
  useConnectionWith: (...a: unknown[]): unknown => mockUseConnectionWith(...a),
  useSharedCalendars: (...a: unknown[]): unknown => mockUseSharedCalendars(...a),
  useSharedCalendarCount: (...a: unknown[]): unknown => mockUseSharedCalendarCount(...a),
}));

const mockUseUserProfileApi = jest.fn();
const mockRefetch = jest.fn().mockResolvedValue(undefined);
jest.mock('@hooks/useConnectionsApi', () => ({
  useUserProfileApi: (...a: unknown[]): unknown => mockUseUserProfileApi(...a),
  useRemoveConnection: () => ({}),
  useBlockUser: () => ({}),
  useSendRequest: () => ({}),
  useResolveRequest: () => ({}),
}));

const mockRun = jest.fn();
let mockIsConnected = true;
jest.mock('@hooks/useOnlineAction', () => ({
  useOnlineAction: () => ({ run: mockRun, isPending: false, isConnected: mockIsConnected }),
}));

const mockShow = jest.fn();
jest.mock('@/components/ui/toast', () => ({
  useToast: () => ({ show: (o: unknown): unknown => mockShow(o) }),
}));

const connectedUser = {
  id: 'them',
  username: 'sarah',
  first_name: 'Sarah',
  last_name: 'Chen',
  avatar_color: '#A78BFA',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockIsConnected = true;
  mockRun.mockResolvedValue({ status: 'success' });
  mockUseUserProfile.mockReturnValue(connectedUser);
  mockUseConnectionWith.mockReturnValue({ id: 'c1', inserted_at: '2026-01-15T00:00:00Z' });
  mockUseSharedCalendars.mockReturnValue([]);
  mockUseSharedCalendarCount.mockReturnValue(0);
  mockUseUserProfileApi.mockReturnValue({
    data: undefined,
    isError: false,
    isLoading: false,
    refetch: mockRefetch,
  });
});

describe('PersonProfileScreen — connected', () => {
  it('renders the profile card with @username, Connected pill, and "Since" from the timestamp', () => {
    const { getByText } = render(<PersonProfileScreen />);
    expect(getByText('Sarah Chen')).toBeTruthy();
    expect(getByText('@sarah')).toBeTruthy();
    expect(getByText('Connected')).toBeTruthy();
    expect(getByText('January 2026')).toBeTruthy();
    expect(getByText('Mutual')).toBeTruthy();
  });

  it('sets the header title to the name', () => {
    render(<PersonProfileScreen />);
    expect(mockSetOptions).toHaveBeenCalledWith(expect.objectContaining({ title: 'Sarah Chen' }));
  });

  it('Find a Time shows a coming-soon toast', () => {
    const { getByText } = render(<PersonProfileScreen />);
    fireEvent.press(getByText('Find a Time'));
    expect(mockShow).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'find-a-time-coming-soon' })
    );
  });

  it('renders shared calendars and navigates on tap', () => {
    mockUseSharedCalendars.mockReturnValue([
      { id: 'cal-1', name: 'Board Game Night', color: '#A78BFA' },
    ]);
    const { getByText } = render(<PersonProfileScreen />);
    fireEvent.press(getByText('Board Game Night'));
    expect(mockNavigate).toHaveBeenCalledWith('CalendarDetail', { calendarId: 'cal-1' });
  });

  it('renders the empty shared-calendars copy when none', () => {
    const { getByText } = render(<PersonProfileScreen />);
    expect(getByText(/You don't share any calendars/i)).toBeTruthy();
  });

  it('Remove → confirm dialog → calls removeConnection with the connection id', () => {
    const { getByText, getByTestId } = render(<PersonProfileScreen />);
    fireEvent.press(getByText('Remove Connection'));
    expect(getByText('Remove Connection?')).toBeTruthy();
    fireEvent.press(getByTestId('confirm-dialog-confirm'));
    expect(mockRun).toHaveBeenCalledWith('c1');
  });

  it('Block → confirm dialog → calls blockUser with the user id (real, not coming-soon)', () => {
    const { getByText, getByTestId } = render(<PersonProfileScreen />);
    fireEvent.press(getByText('Block'));
    expect(getByText('Block Sarah Chen?')).toBeTruthy();
    fireEvent.press(getByTestId('confirm-dialog-confirm'));
    expect(mockRun).toHaveBeenCalledWith('them');
  });

  it('pops back when the connection row disappears while viewing (removed/blocked)', () => {
    const { rerender } = render(<PersonProfileScreen />);
    mockUseConnectionWith.mockReturnValue(null);
    rerender(<PersonProfileScreen />);
    expect(mockGoBack).toHaveBeenCalled();
  });
});

describe('PersonProfileScreen — non-connected (online fetch)', () => {
  function asNonConnected(state: string, extra: Record<string, unknown> = {}) {
    mockUseConnectionWith.mockReturnValue(null);
    mockUseUserProfileApi.mockReturnValue({
      data: {
        ...connectedUser,
        avatar_color: null,
        relationship: { state, request_id: null, connection_id: null, ...extra },
      },
      isError: false,
      isLoading: false,
      refetch: mockRefetch,
    });
  }

  it('loads the profile online (no dead-end) and shows Connect for state none', () => {
    asNonConnected('none');
    const { getByText } = render(<PersonProfileScreen />);
    expect(getByText('Sarah Chen')).toBeTruthy();
    fireEvent.press(getByText('Connect'));
    expect(mockRun).toHaveBeenCalledWith('them');
  });

  it('shows Accept Connection for an incoming request', () => {
    asNonConnected('incoming_pending', { request_id: 'req1' });
    const { getByText } = render(<PersonProfileScreen />);
    fireEvent.press(getByText('Accept Connection'));
    expect(mockRun).toHaveBeenCalledWith({ id: 'req1', status: 'accepted' });
  });

  it('shows the unavailable state when the online profile errors', () => {
    mockUseConnectionWith.mockReturnValue(null);
    mockUseUserProfileApi.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      refetch: mockRefetch,
    });
    const { getByText } = render(<PersonProfileScreen />);
    expect(getByText(/This person isn't available/i)).toBeTruthy();
  });
});
