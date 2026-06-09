import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

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

jest.mock('@hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ user: { id: 'me' } }),
}));

const mockShowToast = jest.fn();
jest.mock('@/components/ui/toast', () => ({
  useToast: () => ({ show: (opts: unknown): unknown => mockShowToast(opts) }),
}));

beforeEach(() => {
  jest.clearAllMocks();
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

  it('renders Connect placeholder for each search result', async () => {
    mockSearchUsers.mockResolvedValue([
      { id: 'u1', first_name: 'Sarah', last_name: 'Chen', avatar_color: null },
    ]);
    const { getByPlaceholderText, findByText } = render(<AddConnectionScreen />);
    typeQuery(getByPlaceholderText, 'sa');
    expect(await findByText('Connect')).toBeTruthy();
  });

  it('Connect placeholder shows a Coming Soon alert when pressed', async () => {
    mockSearchUsers.mockResolvedValue([
      { id: 'u1', first_name: 'Sarah', last_name: 'Chen', avatar_color: null },
    ]);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { getByPlaceholderText, findByText } = render(<AddConnectionScreen />);
    typeQuery(getByPlaceholderText, 'sa');
    fireEvent.press(await findByText('Connect'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Coming Soon',
      expect.stringContaining('Connecting will be available shortly')
    );
    alertSpy.mockRestore();
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
