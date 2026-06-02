import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { PersonProfileScreen } from '../PersonProfileScreen';

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockSetOptions = jest.fn();
const mockNavObject = {
  goBack: mockGoBack,
  navigate: mockNavigate,
  setOptions: mockSetOptions,
};
jest.mock('@react-navigation/native', () => ({
  useNavigation: (): typeof mockNavObject => mockNavObject,
  useRoute: (): { params: { userId: string } } => ({ params: { userId: 'them' } }),
}));

jest.mock('@hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ user: { id: 'me' } }),
}));

const mockUseUserProfile = jest.fn();
const mockUseConnectionWith = jest.fn();
const mockUseSharedCalendars = jest.fn();
const mockUseSharedCalendarCount = jest.fn();
jest.mock('@hooks/useConnections', () => ({
  useUserProfile: (...args: unknown[]): unknown => mockUseUserProfile(...args),
  useConnectionWith: (...args: unknown[]): unknown => mockUseConnectionWith(...args),
  useSharedCalendars: (...args: unknown[]): unknown => mockUseSharedCalendars(...args),
  useSharedCalendarCount: (...args: unknown[]): unknown => mockUseSharedCalendarCount(...args),
}));

const mockRemove = jest.fn();
const mockBlock = jest.fn();
jest.mock('@utils/connections', () => ({
  removeConnection: (...args: unknown[]): unknown => mockRemove(...args),
  blockUser: (...args: unknown[]): unknown => mockBlock(...args),
}));

const mockShowToast = jest.fn();
// Stable `show` reference — see AddConnectionScreen test for rationale.
const mockUseToastReturn = { show: mockShowToast };
jest.mock('@hooks/useToast', () => ({
  useToast: (): { show: jest.Mock } => mockUseToastReturn,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUseUserProfile.mockReturnValue({
    user: {
      id: 'them',
      first_name: 'Sarah',
      last_name: 'Chen',
      avatar_color: '#A78BFA',
    },
    isLoading: false,
  });
  mockUseConnectionWith.mockReturnValue({
    id: 'c1',
    status: 'accepted',
    requester_id: 'me',
    addressee_id: 'them',
    updated_at: '2026-01-15T00:00:00Z',
  });
  mockUseSharedCalendars.mockReturnValue([]);
  mockUseSharedCalendarCount.mockReturnValue(0);
});

describe('PersonProfileScreen', () => {
  it('renders the profile card with name and Connected pill', () => {
    const { getByText } = render(<PersonProfileScreen />);
    expect(getByText('Sarah Chen')).toBeTruthy();
    expect(getByText('Connected')).toBeTruthy();
  });

  it('renders Request Pending pill when status is pending', () => {
    mockUseConnectionWith.mockReturnValue({
      id: 'c1',
      status: 'pending',
      requester_id: 'me',
      addressee_id: 'them',
    });
    const { getByText } = render(<PersonProfileScreen />);
    expect(getByText('Request Pending')).toBeTruthy();
  });

  it('renders Not connected text when no connection', () => {
    mockUseConnectionWith.mockReturnValue(null);
    const { getByText } = render(<PersonProfileScreen />);
    expect(getByText(/Not connected/i)).toBeTruthy();
  });

  it('renders the Since tile only when accepted', () => {
    const { getByText } = render(<PersonProfileScreen />);
    expect(getByText('Since')).toBeTruthy();
    expect(getByText('January 2026')).toBeTruthy();
  });

  it('hides the Since tile when connection is pending', () => {
    mockUseConnectionWith.mockReturnValue({
      id: 'c1',
      status: 'pending',
      requester_id: 'me',
      addressee_id: 'them',
      updated_at: '2026-01-15T00:00:00Z',
    });
    const { queryByText } = render(<PersonProfileScreen />);
    expect(queryByText('Since')).toBeNull();
    expect(queryByText('January 2026')).toBeNull();
  });

  it('hides the Since tile when no connection', () => {
    mockUseConnectionWith.mockReturnValue(null);
    const { queryByText } = render(<PersonProfileScreen />);
    expect(queryByText('Since')).toBeNull();
  });

  it('writes the user name to the nav header via setOptions', () => {
    render(<PersonProfileScreen />);
    expect(mockSetOptions).toHaveBeenCalledWith({ title: 'Sarah Chen' });
  });

  it('hides the Remove row when there is no connection (Block only)', () => {
    mockUseConnectionWith.mockReturnValue(null);
    const { queryByText, getByText } = render(<PersonProfileScreen />);
    expect(queryByText('Remove Connection')).toBeNull();
    expect(getByText('Block')).toBeTruthy();
  });

  it('Find a Time tap shows Coming Soon toast (id + title + placement)', () => {
    const { getByText } = render(<PersonProfileScreen />);
    fireEvent.press(getByText(/Find a Time/i));
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'find-a-time-coming-soon',
        title: 'Find a Time is coming soon.',
        placement: 'top',
      })
    );
  });

  it('renders Shared Calendars list when present', () => {
    mockUseSharedCalendars.mockReturnValue([
      { id: 'cal-1', name: 'Board Game Night', type: 'social', color: '#A78BFA' },
    ]);
    mockUseSharedCalendarCount.mockReturnValue(1);
    const { getByText } = render(<PersonProfileScreen />);
    expect(getByText('Board Game Night')).toBeTruthy();
  });

  it('tapping a shared calendar navigates to CalendarDetail', () => {
    mockUseSharedCalendars.mockReturnValue([
      { id: 'cal-1', name: 'Board Game Night', type: 'social', color: '#A78BFA' },
    ]);
    mockUseSharedCalendarCount.mockReturnValue(1);
    const { getByText } = render(<PersonProfileScreen />);
    fireEvent.press(getByText('Board Game Night'));
    expect(mockNavigate).toHaveBeenCalledWith('CalendarDetail', { calendarId: 'cal-1' });
  });

  it('renders the empty calendars copy when none shared', () => {
    const { getByText } = render(<PersonProfileScreen />);
    expect(getByText(/You don't share any calendars/i)).toBeTruthy();
  });

  it('Remove tap shows Alert; confirm calls removeConnection and goBack', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_, __, buttons) => {
      const remove = buttons?.find((b) => b.text === 'Remove');
      remove?.onPress?.();
    });
    const { getByText } = render(<PersonProfileScreen />);
    fireEvent.press(getByText('Remove Connection'));
    expect(alertSpy).toHaveBeenCalled();
    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith('c1'));
    await waitFor(() => expect(mockGoBack).toHaveBeenCalled());
    alertSpy.mockRestore();
  });

  it('Block tap shows Alert; confirm calls blockUser(otherUserId, currentUserId) and goBack', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_, __, buttons) => {
      const block = buttons?.find((b) => b.text === 'Block');
      block?.onPress?.();
    });
    const { getByText } = render(<PersonProfileScreen />);
    fireEvent.press(getByText('Block'));
    expect(alertSpy).toHaveBeenCalled();
    await waitFor(() => expect(mockBlock).toHaveBeenCalledWith('them', 'me'));
    await waitFor(() => expect(mockGoBack).toHaveBeenCalled());
    alertSpy.mockRestore();
  });

  it('shows the unavailable empty state when user is null', () => {
    mockUseUserProfile.mockReturnValue({ user: null, isLoading: false });
    const { getByText } = render(<PersonProfileScreen />);
    expect(getByText(/This person isn't available/i)).toBeTruthy();
  });

  it('renders the skeleton (no "unavailable" copy) while userLoading and no cached row', () => {
    mockUseUserProfile.mockReturnValue({ user: null, isLoading: true });
    const { queryByText } = render(<PersonProfileScreen />);
    expect(queryByText(/This person isn't available/i)).toBeNull();
    // setOptions should not be called with a name yet (no name to show).
    expect(mockSetOptions).not.toHaveBeenCalled();
  });
});
