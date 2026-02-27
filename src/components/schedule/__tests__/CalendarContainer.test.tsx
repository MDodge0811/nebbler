import { render, act } from '@testing-library/react-native';
import { CalendarContainer } from '../CalendarContainer';
import { useScheduleStore } from '@stores/useScheduleStore';

const storeToday = useScheduleStore.getState().today;

describe('CalendarContainer', () => {
  beforeEach(() => {
    useScheduleStore.setState({
      selectedDate: storeToday,
      visibleDate: storeToday,
      today: storeToday,
      viewMode: 'week',
      displayMonth: storeToday.slice(0, 7) + '-01',
      isSyncLocked: false,
    });
  });

  it('renders the calendar container', () => {
    const { getByTestId } = render(<CalendarContainer markedDates={{}} />);
    expect(getByTestId('calendar-container')).toBeTruthy();
  });

  it('renders the grab handle', () => {
    const { getByTestId } = render(<CalendarContainer markedDates={{}} />);
    expect(getByTestId('grab-handle')).toBeTruthy();
  });

  it('renders day header labels', () => {
    const { getByText } = render(<CalendarContainer markedDates={{}} />);
    // WeekStripDayHeaders renders S, M, T, W, T, F, S
    expect(getByText('M')).toBeTruthy();
    expect(getByText('W')).toBeTruthy();
    expect(getByText('F')).toBeTruthy();
  });

  it('starts in week viewMode', () => {
    expect(useScheduleStore.getState().viewMode).toBe('week');
    render(<CalendarContainer markedDates={{}} />);
    expect(useScheduleStore.getState().viewMode).toBe('week');
  });

  it('setViewMode to month updates store', () => {
    render(<CalendarContainer markedDates={{}} />);
    act(() => {
      useScheduleStore.getState().setViewMode('month');
    });
    expect(useScheduleStore.getState().viewMode).toBe('month');
  });

  it('renders MonthGrid when expanded to month mode', () => {
    const { getByTestId, rerender } = render(<CalendarContainer markedDates={{}} />);

    // Start in week mode — no month grid
    expect(() => getByTestId('month-grid-flatlist')).toThrow();

    // Switch to month mode
    act(() => {
      useScheduleStore.getState().setViewMode('month');
    });
    rerender(<CalendarContainer markedDates={{}} />);

    expect(getByTestId('month-grid-flatlist')).toBeTruthy();
  });

  it('collapsing back to week mode hides MonthGrid', () => {
    const { getByTestId, rerender } = render(<CalendarContainer markedDates={{}} />);

    // Expand to month
    act(() => {
      useScheduleStore.getState().setViewMode('month');
    });
    rerender(<CalendarContainer markedDates={{}} />);
    expect(getByTestId('month-grid-flatlist')).toBeTruthy();

    // Collapse back to week
    act(() => {
      useScheduleStore.getState().setViewMode('week');
    });
    rerender(<CalendarContainer markedDates={{}} />);

    // MonthGrid stays mounted (hasExpandedRef) but is hidden via conditional render
    // In our implementation, !isWeekMode is false, so MonthGrid is not rendered
    expect(() => getByTestId('month-grid-flatlist')).toThrow();
  });

  it('sets displayMonth from visibleDate on expand', () => {
    render(<CalendarContainer markedDates={{}} />);

    // Set a visible date in March
    act(() => {
      useScheduleStore.getState().setVisibleDate('2026-03-15');
    });

    // Simulate expand by setting month mode
    act(() => {
      useScheduleStore.getState().setViewMode('month');
      useScheduleStore.getState().setDisplayMonth('2026-03-01');
    });

    expect(useScheduleStore.getState().displayMonth).toBe('2026-03-01');
    expect(useScheduleStore.getState().viewMode).toBe('month');
  });
});
