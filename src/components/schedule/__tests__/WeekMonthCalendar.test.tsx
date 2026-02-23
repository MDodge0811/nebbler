import { render, act } from '@testing-library/react-native';
import { WeekMonthCalendar } from '../WeekMonthCalendar';
import { useScheduleStore } from '@stores/useScheduleStore';

jest.mock('@powersync/react', () => ({
  useQuery: jest.fn().mockReturnValue({ data: [], isLoading: false, error: undefined }),
}));

// Override the global CalendarProvider mock with a jest.fn so we can capture callback props.
// ExpandableCalendar is already a jest.fn in jest.setup.js.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCalendarProvider = jest.fn(({ children }: any) => children);
jest.mock('react-native-calendars', () => {
  const { createContext } = require('react');
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CalendarProvider: (props: any) => mockCalendarProvider(props),
    ExpandableCalendar: jest.fn(() => null),
    CalendarContext: createContext({ setDate: jest.fn() }),
  };
});

describe('WeekMonthCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useScheduleStore.setState({
      selectedDate: '2026-02-15',
      visibleDate: '2026-02-15',
      isSyncLocked: false,
    });
  });

  it('renders without crashing', () => {
    expect(() => render(<WeekMonthCalendar />)).not.toThrow();
  });

  it('calls selectDate in the store when a date is tapped', () => {
    render(<WeekMonthCalendar />);

    const { onDateChanged } = mockCalendarProvider.mock.calls[0][0];
    act(() => {
      onDateChanged('2026-05-10');
    });

    expect(useScheduleStore.getState().selectedDate).toBe('2026-05-10');
    expect(useScheduleStore.getState().visibleDate).toBe('2026-05-10');
  });

  it('calls setVisibleDate but not selectDate when month changes', () => {
    render(<WeekMonthCalendar />);

    const { onMonthChange } = mockCalendarProvider.mock.calls[0][0];
    act(() => {
      onMonthChange({ dateString: '2026-07-01' });
    });

    expect(useScheduleStore.getState().visibleDate).toBe('2026-07-01');
    // selectedDate should NOT change on month swipe
    expect(useScheduleStore.getState().selectedDate).toBe('2026-02-15');
  });

  it('does not call selectDate when isSyncLocked is true', () => {
    useScheduleStore.setState({ isSyncLocked: true });
    render(<WeekMonthCalendar />);

    const { onDateChanged } = mockCalendarProvider.mock.calls[0][0];
    act(() => {
      onDateChanged('2026-05-10');
    });

    // selectedDate should remain unchanged because sync is locked
    expect(useScheduleStore.getState().selectedDate).toBe('2026-02-15');
  });

  it('calls onDateSelected when a date is tapped and sync is not locked', () => {
    const handleDateSelected = jest.fn();
    render(<WeekMonthCalendar onDateSelected={handleDateSelected} />);

    const { onDateChanged } = mockCalendarProvider.mock.calls[0][0];
    act(() => {
      onDateChanged('2026-05-10');
    });

    expect(handleDateSelected).toHaveBeenCalledWith('2026-05-10');
  });
});
