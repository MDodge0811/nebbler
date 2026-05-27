import { render, fireEvent, act } from '@testing-library/react-native';

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

const mockUpdateCalendar = jest.fn();
const mockDeleteCalendar = jest.fn();
jest.mock('@hooks/useCalendars', () => ({
  useCalendarMutations: () => ({
    updateCalendar: mockUpdateCalendar,
    deleteCalendar: mockDeleteCalendar,
  }),
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

describe('CalendarDetailScreen — edit mode', () => {
  it('enters edit mode when pencil pressed', () => {
    mockDetail = detail();
    const { getByTestId, getByText } = render(<CalendarDetailScreen />);
    // header pencil is rendered via setOptions; we use the same testID by exposing
    // an in-body edit entry for tests when needed. For now, simulate by re-rendering
    // with mode=edit via the screen's state — see implementation note: edit entry
    // is also exposed via testID 'enter-edit-btn-inline' for testability.
    fireEvent.press(getByTestId('enter-edit-btn-inline', { includeHiddenElements: true }));
    expect(getByText('Edit Calendar')).toBeTruthy();
  });

  it('hides Discoverable toggle for social calendars', () => {
    mockDetail = detail({ calendar: { ...baseCalendar, type: 'social' } });
    const { getByTestId, queryByText } = render(<CalendarDetailScreen />);
    fireEvent.press(getByTestId('enter-edit-btn-inline', { includeHiddenElements: true }));
    expect(queryByText('Discoverable')).toBeNull();
  });

  it('shows Discoverable toggle for public calendars', () => {
    mockDetail = detail({ calendar: { ...baseCalendar, type: 'public' } });
    const { getByTestId, getByText } = render(<CalendarDetailScreen />);
    fireEvent.press(getByTestId('enter-edit-btn-inline', { includeHiddenElements: true }));
    expect(getByText('Discoverable')).toBeTruthy();
  });

  it('hides Danger Zone for non-owner', () => {
    mockDetail = detail({
      permissions: {
        canView: true,
        canEnterEdit: true,
        canSave: true,
        canDelete: false,
        canCreateEvent: true,
        isFreeBusy: false,
      },
    });
    const { getByTestId, queryByText } = render(<CalendarDetailScreen />);
    fireEvent.press(getByTestId('enter-edit-btn-inline', { includeHiddenElements: true }));
    expect(queryByText('Delete Calendar')).toBeNull();
  });

  it('returns to view mode on X press', () => {
    mockDetail = detail();
    const { getByTestId, queryByText, getByText } = render(<CalendarDetailScreen />);
    fireEvent.press(getByTestId('enter-edit-btn-inline', { includeHiddenElements: true }));
    expect(getByText('Edit Calendar')).toBeTruthy();
    fireEvent.press(getByTestId('close-edit-btn', { includeHiddenElements: true }));
    expect(queryByText('Edit Calendar')).toBeNull();
  });
});

describe('CalendarDetailScreen — save & delete', () => {
  beforeEach(() => {
    mockUpdateCalendar.mockReset();
    mockDeleteCalendar.mockReset();
  });

  it('calls updateCalendar with current edit state', async () => {
    mockDetail = detail();
    mockUpdateCalendar.mockResolvedValue(undefined);
    const { getByTestId } = render(<CalendarDetailScreen />);
    fireEvent.press(getByTestId('enter-edit-btn-inline', { includeHiddenElements: true }));
    fireEvent.press(getByTestId('save-edit-btn', { includeHiddenElements: true }));
    await Promise.resolve();
    expect(mockUpdateCalendar).toHaveBeenCalledWith(
      'cal-1',
      expect.objectContaining({
        name: 'Game Night',
        color: '#A78BFA',
        affects_availability: 1,
      })
    );
  });

  it('omits discoverable for non-public calendars', async () => {
    mockDetail = detail({ calendar: { ...baseCalendar, type: 'social' } });
    mockUpdateCalendar.mockResolvedValue(undefined);
    const { getByTestId } = render(<CalendarDetailScreen />);
    fireEvent.press(getByTestId('enter-edit-btn-inline', { includeHiddenElements: true }));
    fireEvent.press(getByTestId('save-edit-btn', { includeHiddenElements: true }));
    await Promise.resolve();
    const args = mockUpdateCalendar.mock.calls[0][1];
    expect(args).not.toHaveProperty('discoverable');
  });

  it('shows success toast and returns to view mode on save', async () => {
    mockDetail = detail();
    mockUpdateCalendar.mockResolvedValue(undefined);
    const { getByTestId, getByText, queryByText } = render(<CalendarDetailScreen />);
    fireEvent.press(getByTestId('enter-edit-btn-inline', { includeHiddenElements: true }));
    await act(async () => {
      fireEvent.press(getByTestId('save-edit-btn', { includeHiddenElements: true }));
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(getByText('Changes saved!')).toBeTruthy();
    expect(queryByText('Edit Calendar')).toBeNull();
  });

  it('stays in edit mode on save error', async () => {
    mockDetail = detail();
    mockUpdateCalendar.mockRejectedValue(new Error('boom'));
    const { getByTestId, getByText } = render(<CalendarDetailScreen />);
    fireEvent.press(getByTestId('enter-edit-btn-inline', { includeHiddenElements: true }));
    await act(async () => {
      fireEvent.press(getByTestId('save-edit-btn', { includeHiddenElements: true }));
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(getByText('Edit Calendar')).toBeTruthy();
    expect(getByText(/Couldn't save changes/i)).toBeTruthy();
  });

  it('deletes the calendar and navigates back', async () => {
    mockDetail = detail();
    mockDeleteCalendar.mockResolvedValue(undefined);
    const { getByTestId, getByText } = render(<CalendarDetailScreen />);
    fireEvent.press(getByTestId('enter-edit-btn-inline', { includeHiddenElements: true }));
    fireEvent.press(getByTestId('delete-calendar-btn'));
    await act(async () => {
      fireEvent.press(getByText('Delete'));
      await Promise.resolve();
    });
    expect(mockDeleteCalendar).toHaveBeenCalledWith('cal-1');
    expect(mockGoBack).toHaveBeenCalled();
  });
});

describe('CalendarDetailScreen — reactive pop-back', () => {
  it('calls goBack when calendar becomes null after having loaded', () => {
    mockDetail = detail();
    const { rerender } = render(<CalendarDetailScreen />);
    mockGoBack.mockClear();

    mockDetail = detail({ calendar: null });
    rerender(<CalendarDetailScreen />);

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('calls goBack when currentMembership becomes null after having loaded', () => {
    mockDetail = detail();
    const { rerender } = render(<CalendarDetailScreen />);
    mockGoBack.mockClear();

    mockDetail = detail({ currentMembership: null });
    rerender(<CalendarDetailScreen />);

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('does NOT call goBack on first render when calendar is null', () => {
    mockDetail = detail({ calendar: null });
    render(<CalendarDetailScreen />);

    expect(mockGoBack).not.toHaveBeenCalled();
  });
});
