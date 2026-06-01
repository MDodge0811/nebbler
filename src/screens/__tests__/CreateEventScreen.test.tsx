import { render, fireEvent, act } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

const mockGoBack = jest.fn();
const mockSetOptions = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    setOptions: mockSetOptions,
  }),
}));

const mockCreateEvent = jest.fn();
jest.mock('@hooks/useCalendarEvents', () => ({
  useEventMutations: () => ({ createEvent: mockCreateEvent }),
}));

jest.mock('@hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ authUser: { id: 'u1' } }),
}));

let mockWritableCalendars: unknown[] = [];
jest.mock('@hooks/useWritableCalendars', () => ({
  useWritableCalendars: () => ({ data: mockWritableCalendars }),
}));

const { CreateEventScreen } = require('../CreateEventScreen') as {
  CreateEventScreen: () => React.ReactElement;
};

// Capture the latest header button onPress installed via navigation.setOptions.
type HeaderButton = () => React.ReactElement<{ onPress?: () => void }>;
type HeaderOpts = { headerLeft?: HeaderButton; headerRight?: HeaderButton };
function latestHeaderOnPress(side: 'headerLeft' | 'headerRight'): (() => void) | undefined {
  const calls = mockSetOptions.mock.calls as Array<[HeaderOpts]>;
  for (let i = calls.length - 1; i >= 0; i--) {
    const factory = calls[i]?.[0][side];
    if (factory) {
      return factory().props.onPress;
    }
  }
  return undefined;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockWritableCalendars = [{ id: 'cal-1', name: 'Work' }];
});

describe('CreateEventScreen — render', () => {
  it('renders the title input, default calendar name, and Starts/Ends rows', () => {
    const { getByPlaceholderText, getByText } = render(<CreateEventScreen />);
    expect(getByPlaceholderText('Event title')).toBeTruthy();
    expect(getByText('Work')).toBeTruthy();
    expect(getByText('Starts')).toBeTruthy();
    expect(getByText('Ends')).toBeTruthy();
  });

  it('falls back to "Personal Calendar" when there are no writable calendars', () => {
    mockWritableCalendars = [];
    const { getByText } = render(<CreateEventScreen />);
    expect(getByText('Personal Calendar')).toBeTruthy();
  });

  it('reveals the description field when "+ Add details" is pressed', () => {
    const { getByText, getByPlaceholderText } = render(<CreateEventScreen />);
    fireEvent.press(getByText('+ Add details'));
    expect(getByPlaceholderText('Add a description')).toBeTruthy();
  });
});

describe('CreateEventScreen — save flow', () => {
  it('creates the event and navigates back', async () => {
    mockCreateEvent.mockResolvedValue('evt-new');
    const { getByPlaceholderText } = render(<CreateEventScreen />);

    fireEvent.changeText(getByPlaceholderText('Event title'), 'Lunch');

    await act(async () => {
      latestHeaderOnPress('headerRight')?.();
      await Promise.resolve();
    });

    expect(mockCreateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        calendarId: 'cal-1',
        createdByUserId: 'u1',
        title: 'Lunch',
      })
    );
    expect(mockGoBack).toHaveBeenCalled();
  });
});

describe('CreateEventScreen — close flow', () => {
  it('navigates back immediately when the form is pristine', () => {
    render(<CreateEventScreen />);
    act(() => {
      latestHeaderOnPress('headerLeft')?.();
    });
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('prompts to discard when the form is dirty', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByPlaceholderText } = render(<CreateEventScreen />);
    fireEvent.changeText(getByPlaceholderText('Event title'), 'Lunch');
    act(() => {
      latestHeaderOnPress('headerLeft')?.();
    });
    expect(alertSpy).toHaveBeenCalledWith(
      'Discard Changes?',
      expect.any(String),
      expect.any(Array)
    );
    expect(mockGoBack).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
