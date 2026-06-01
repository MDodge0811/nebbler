import { render, fireEvent, act } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

const mockGoBack = jest.fn();
const mockSetOptions = jest.fn();
let mockRouteParams: { eventId: string } = { eventId: 'evt-1' };

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    setOptions: mockSetOptions,
  }),
  useRoute: () => ({ params: mockRouteParams }),
}));

let mockDetail: object;
jest.mock('@hooks/useEventDetail', () => ({
  useEventDetail: (): unknown => mockDetail,
}));

const mockUpdateEvent = jest.fn();
const mockDeleteEvent = jest.fn();
jest.mock('@hooks/useCalendarEvents', () => ({
  useEventMutations: () => ({
    updateEvent: mockUpdateEvent,
    deleteEvent: mockDeleteEvent,
  }),
}));

jest.mock('@hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ authUser: { id: 'u1' } }),
}));

let mockWritableCalendars: unknown[] = [];
jest.mock('@hooks/useWritableCalendars', () => ({
  useWritableCalendars: () => ({ data: mockWritableCalendars }),
}));

const { EventDetailScreen } = require('../EventDetailScreen') as {
  EventDetailScreen: () => React.ReactElement;
};

const baseEvent = {
  id: 'evt-1',
  calendar_id: 'cal-1',
  created_by_user_id: 'u1',
  title: 'Team Sync',
  description: 'Weekly sync.',
  start_time: '2099-01-01T19:00:00Z',
  end_time: '2099-01-01T20:00:00Z',
};

const baseCalendar = { id: 'cal-1', name: 'Work' };
const baseCreator = {
  id: 'u1',
  display_name: 'Sarah',
  first_name: 'Sarah',
  last_name: 'Lee',
  email: 'sarah@example.com',
};

function detail(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    event: baseEvent,
    calendar: baseCalendar,
    creator: baseCreator,
    membership: null,
    permissions: { canEdit: true, canDelete: true, isFreeBusy: false },
    ...overrides,
  };
}

// Capture the latest header button onPress installed via navigation.setOptions.
type HeaderButton = () => React.ReactElement<{ onPress?: () => void }>;
function latestHeaderRightOnPress(): (() => void) | undefined {
  const calls = mockSetOptions.mock.calls as Array<[{ headerRight?: HeaderButton }]>;
  for (let i = calls.length - 1; i >= 0; i--) {
    const factory = calls[i]?.[0].headerRight;
    if (factory) {
      return factory().props.onPress;
    }
  }
  return undefined;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRouteParams = { eventId: 'evt-1' };
  mockWritableCalendars = [{ id: 'cal-1', name: 'Work' }];
});

describe('EventDetailScreen — loading', () => {
  it('shows Loading when event is null', () => {
    mockDetail = detail({ event: null });
    const { getByText } = render(<EventDetailScreen />);
    expect(getByText('Loading...')).toBeTruthy();
  });
});

describe('EventDetailScreen — view mode', () => {
  it('renders title, calendar, creator, and description', () => {
    mockDetail = detail();
    const { getByText } = render(<EventDetailScreen />);
    expect(getByText('Team Sync')).toBeTruthy();
    expect(getByText('Work')).toBeTruthy();
    expect(getByText('Sarah')).toBeTruthy();
    expect(getByText('Weekly sync.')).toBeTruthy();
  });

  it('falls back to first+last name when display_name is empty', () => {
    mockDetail = detail({ creator: { ...baseCreator, display_name: '' } });
    const { getByText } = render(<EventDetailScreen />);
    expect(getByText('Sarah Lee')).toBeTruthy();
  });

  it('shows Delete Event when canDelete', () => {
    mockDetail = detail();
    const { getByText } = render(<EventDetailScreen />);
    expect(getByText('Delete Event')).toBeTruthy();
  });

  it('hides Delete Event when not canDelete', () => {
    mockDetail = detail({ permissions: { canEdit: true, canDelete: false, isFreeBusy: false } });
    const { queryByText } = render(<EventDetailScreen />);
    expect(queryByText('Delete Event')).toBeNull();
  });
});

describe('EventDetailScreen — free/busy mode', () => {
  it('renders Busy badge and hides title/description/delete', () => {
    mockDetail = detail({
      permissions: { canEdit: false, canDelete: false, isFreeBusy: true },
    });
    const { getByText, queryByText } = render(<EventDetailScreen />);
    expect(getByText('Busy')).toBeTruthy();
    expect(getByText('Work')).toBeTruthy();
    expect(queryByText('Team Sync')).toBeNull();
    expect(queryByText('Weekly sync.')).toBeNull();
    expect(queryByText('Delete Event')).toBeNull();
  });
});

describe('EventDetailScreen — delete flow', () => {
  it('confirms then calls deleteEvent and navigates back', async () => {
    mockDetail = detail();
    mockDeleteEvent.mockResolvedValue(undefined);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const del = buttons?.find((b) => b.text === 'Delete');
      del?.onPress?.();
    });
    const { getByText } = render(<EventDetailScreen />);
    await act(async () => {
      fireEvent.press(getByText('Delete Event'));
      await Promise.resolve();
    });
    expect(mockDeleteEvent).toHaveBeenCalledWith('evt-1');
    expect(mockGoBack).toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});

describe('EventDetailScreen — edit flow', () => {
  it('exposes an Edit header action when canEdit and not free/busy', () => {
    mockDetail = detail();
    render(<EventDetailScreen />);
    expect(latestHeaderRightOnPress()).toBeInstanceOf(Function);
  });

  it('enters edit mode and saves via updateEvent', async () => {
    mockDetail = detail();
    mockUpdateEvent.mockResolvedValue(undefined);
    const { getByPlaceholderText } = render(<EventDetailScreen />);

    // Press header Edit
    act(() => {
      latestHeaderRightOnPress()?.();
    });
    // Now in edit mode — title input prefilled
    const titleInput = getByPlaceholderText('Event title') as unknown as {
      props: { value?: string };
    };
    expect(titleInput.props.value).toBe('Team Sync');

    // Press header Save
    await act(async () => {
      latestHeaderRightOnPress()?.();
      await Promise.resolve();
    });
    expect(mockUpdateEvent).toHaveBeenCalledWith(
      'evt-1',
      expect.objectContaining({ title: 'Team Sync', calendar_id: 'cal-1' })
    );
  });
});
