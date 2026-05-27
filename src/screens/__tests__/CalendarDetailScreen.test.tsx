import { render, fireEvent } from '@testing-library/react-native';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockSetOptions = jest.fn();
let mockRouteParams: { calendarId: string } = { calendarId: 'cal-1' };

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    setOptions: mockSetOptions,
    replace: jest.fn(),
  }),
  useRoute: () => ({ params: mockRouteParams }),
}));

let mockDetail: any;
jest.mock('@hooks/useCalendarDetail', () => ({
  useCalendarDetail: () => mockDetail,
}));

jest.mock('@hooks/useCalendars', () => ({
  useCalendarMutations: () => ({ updateCalendar: jest.fn(), deleteCalendar: jest.fn() }),
}));

const { CalendarDetailScreen } = require('../CalendarDetailScreen');

const baseCalendar = {
  id: 'cal-1',
  owner_id: 'u1',
  type: 'social',
  name: 'Game Night',
  description: 'Weekly game night.',
  color: '#A78BFA',
  rsvp_enabled: 1,
  discoverable: 0,
  default_view_mode: 'full',
  household_sharing: 1,
  affects_availability: 1,
  deleted_at: null,
};

function detail(overrides: Partial<any> = {}) {
  return {
    calendar: baseCalendar,
    ownerName: 'Sarah',
    currentMembership: { role_level: 40, role_name: 'owner' },
    members: [
      {
        id: 'm1',
        user_id: 'u1',
        role_id: 'r1',
        role_level: 40,
        role_name: 'owner',
        display_name: 'Sarah',
        avatar_initial: 'S',
      },
    ],
    upcomingEvents: [
      {
        id: 'e1',
        calendar_id: 'cal-1',
        title: 'Catan',
        start_time: '2099-01-01T19:00:00Z',
        end_time: '2099-01-01T22:00:00Z',
      },
    ],
    effectiveViewMode: 'full',
    permissions: {
      canView: true,
      canEnterEdit: true,
      canSave: true,
      canDelete: true,
      canCreateEvent: true,
      isFreeBusy: false,
    },
    isLoading: false,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRouteParams = { calendarId: 'cal-1' };
});

describe('CalendarDetailScreen — view mode', () => {
  it('renders calendar name and description', () => {
    mockDetail = detail();
    const { getByText } = render(<CalendarDetailScreen />);
    expect(getByText('Game Night')).toBeTruthy();
    expect(getByText('Weekly game night.')).toBeTruthy();
  });

  it('renders upcoming events', () => {
    mockDetail = detail();
    const { getByText } = render(<CalendarDetailScreen />);
    expect(getByText('Catan')).toBeTruthy();
  });

  it('shows empty events placeholder when list is empty', () => {
    mockDetail = detail({ upcomingEvents: [] });
    const { getByText } = render(<CalendarDetailScreen />);
    expect(getByText('No upcoming events.')).toBeTruthy();
  });

  it('hides members section for private calendars', () => {
    mockDetail = detail({ calendar: { ...baseCalendar, type: 'private' } });
    const { queryByText } = render(<CalendarDetailScreen />);
    expect(queryByText(/members/i)).toBeNull();
  });

  it('renders Busy + hides FAB when isFreeBusy', () => {
    mockDetail = detail({
      effectiveViewMode: 'free_busy',
      permissions: {
        canView: true,
        canEnterEdit: false,
        canSave: false,
        canDelete: false,
        canCreateEvent: false,
        isFreeBusy: true,
      },
    });
    const { getByText, queryByTestId } = render(<CalendarDetailScreen />);
    expect(getByText('Busy')).toBeTruthy();
    expect(queryByTestId('add-event-fab')).toBeNull();
  });

  it('navigates to EventDetail on event press', () => {
    mockDetail = detail();
    const { getByText } = render(<CalendarDetailScreen />);
    fireEvent.press(getByText('Catan'));
    expect(mockNavigate).toHaveBeenCalledWith('EventDetail', { eventId: 'e1' });
  });
});
