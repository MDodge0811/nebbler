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
});
