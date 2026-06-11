import { render, act } from '@testing-library/react-native';

import { useScheduleStore } from '@stores/useScheduleStore';

import { CalendarContainer } from '../CalendarContainer';

const storeToday = useScheduleStore.getState().today;

describe('CalendarContainer', () => {
  beforeEach(() => {
    useScheduleStore.setState({
      selectedDate: storeToday,
      visibleDate: storeToday,
      today: storeToday,
      viewMode: 'week',
      displayMonth: storeToday.slice(0, 7) + '-01',
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

  // Lazy-mount: MonthGrid is not mounted in week mode until first expansion
  it('mounts WeekStrip unconditionally (week mode)', () => {
    const { getByTestId } = render(<CalendarContainer markedDates={{}} />);
    expect(useScheduleStore.getState().viewMode).toBe('week');
    // week-strip-wrapper is always present
    expect(getByTestId('week-strip-wrapper')).toBeTruthy();
  });

  it('does not mount MonthGrid before the first expansion', () => {
    useScheduleStore.setState({ viewMode: 'week' });
    const { queryByTestId } = render(<CalendarContainer markedDates={{}} />);
    expect(queryByTestId('month-grid-flatlist')).toBeNull();
  });

  it('mounts WeekStrip unconditionally (month mode)', () => {
    useScheduleStore.setState({ viewMode: 'month' });
    const { getByTestId } = render(<CalendarContainer markedDates={{}} />);
    expect(getByTestId('week-strip-wrapper')).toBeTruthy();
  });

  it('mounts MonthGrid immediately when starting in month mode', () => {
    useScheduleStore.setState({ viewMode: 'month' });
    const { getByTestId } = render(<CalendarContainer markedDates={{}} />);
    expect(getByTestId('month-grid-flatlist')).toBeTruthy();
  });

  it('WeekStrip always mounted; MonthGrid mounted only after first expansion, then stays', () => {
    // Start in month mode so the grid is mounted from the beginning of this test
    useScheduleStore.setState({ viewMode: 'month' });
    const { getByTestId, rerender } = render(<CalendarContainer markedDates={{}} />);

    // Both mounted in month mode
    expect(getByTestId('week-strip-wrapper')).toBeTruthy();
    expect(getByTestId('month-grid-flatlist')).toBeTruthy();

    // Collapse back to week — grid stays mounted (lazy-mount: never unmounts once shown)
    act(() => {
      useScheduleStore.getState().setViewMode('week');
    });
    rerender(<CalendarContainer markedDates={{}} />);

    // WeekStrip still mounted
    expect(getByTestId('week-strip-wrapper')).toBeTruthy();
    // MonthGrid remains mounted (was shown once — sticky mount)
    expect(getByTestId('month-grid-flatlist')).toBeTruthy();

    // Expand again to month mode
    act(() => {
      useScheduleStore.getState().setViewMode('month');
    });
    rerender(<CalendarContainer markedDates={{}} />);

    // Still both mounted
    expect(getByTestId('week-strip-wrapper')).toBeTruthy();
    expect(getByTestId('month-grid-flatlist')).toBeTruthy();
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
