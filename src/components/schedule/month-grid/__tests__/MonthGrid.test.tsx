import { render, fireEvent, act } from '@testing-library/react-native';

import { useScheduleStore } from '@stores/useScheduleStore';

import { MonthGrid } from '../MonthGrid';

// The store initializes "today" at module load
const storeToday = useScheduleStore.getState().today;

// useMonthPages generates ±6 months centred on displayMonth.
// We anchor displayMonth to a fixed value so page indices are deterministic.
// centerIndex = 6 → page 6 = '2026-02-01', page 7 = '2026-03-01'.
const FIXED_DISPLAY_MONTH = '2026-02-01';
// Build a specific date in the fixed display month for testing
const testDate = `${FIXED_DISPLAY_MONTH.slice(0, 7)}-15`;

// RN test environment default: NativeModules.js mocks Dimensions with width=750.
// MonthGrid uses useWindowDimensions().width as screenWidth for page math.
const SCREEN_WIDTH = 750;

// Helper: fire onMomentumScrollEnd simulating a swipe to a page
function fireMomentumScrollEnd(component: ReturnType<typeof render>, page: number): void {
  fireEvent(component.getByTestId('month-grid-flatlist'), 'momentumScrollEnd', {
    nativeEvent: { contentOffset: { x: SCREEN_WIDTH * page, y: 0 } },
  });
}

// Helper: page index of a month relative to FIXED_DISPLAY_MONTH anchor (centerIndex=6)
function pageIndexOf(monthKey: string): number {
  // months[] = [-6, -5, ..., 0, ..., +6] offsets from FIXED_DISPLAY_MONTH
  // centerIndex = 6, so page = 6 + offset
  const anchor = new Date(FIXED_DISPLAY_MONTH + 'T12:00:00');
  const target = new Date(monthKey + 'T12:00:00');
  const offset =
    (target.getFullYear() - anchor.getFullYear()) * 12 + (target.getMonth() - anchor.getMonth());
  return 6 + offset; // centerIndex = 6
}

describe('MonthGrid', () => {
  beforeEach(() => {
    useScheduleStore.setState({
      selectedDate: storeToday,
      visibleDate: storeToday,
      today: storeToday,
      viewMode: 'month',
      displayMonth: FIXED_DISPLAY_MONTH,
    });
  });

  it('renders the month grid FlatList', () => {
    const { getByTestId } = render(<MonthGrid markedDates={{}} />);
    expect(getByTestId('month-grid-flatlist')).toBeTruthy();
  });

  it('renders day cells for the current month', () => {
    const { getByLabelText } = render(<MonthGrid markedDates={{}} />);
    expect(getByLabelText(testDate)).toBeTruthy();
  });

  it('calls onDateSelected when a day is pressed', () => {
    const onDateSelected = jest.fn();
    const { getByLabelText } = render(
      <MonthGrid onDateSelected={onDateSelected} markedDates={{}} />
    );
    fireEvent.press(getByLabelText(testDate));
    expect(onDateSelected).toHaveBeenCalled();
  });

  it('renders event dots for marked dates (new colors+starred shape)', () => {
    const markedDates = {
      [testDate]: { colors: ['#00DB74', '#FFB3B3'], starred: false },
    };
    const { getAllByTestId } = render(<MonthGrid markedDates={markedDates} />);
    expect(getAllByTestId('event-dot').length).toBeGreaterThanOrEqual(2);
  });

  it('renders star marker for starred dates', () => {
    const markedDates = {
      [testDate]: { colors: ['#00DB74'], starred: true },
    };
    const { getAllByTestId } = render(<MonthGrid markedDates={markedDates} />);
    expect(getAllByTestId('star-marker').length).toBeGreaterThanOrEqual(1);
  });

  it('tapping an adjacent-month day selects it but does NOT advance the displayed month', () => {
    // March 2026's grid shows trailing April days (Apr 1–4) as faded adjacent cells.
    useScheduleStore.setState({ displayMonth: '2026-03-01' });
    const onDateSelected = jest.fn();
    const { getAllByLabelText } = render(
      <MonthGrid onDateSelected={onDateSelected} markedDates={{}} />
    );
    // Apr 1 appears as an adjacent (faded) day in March's grid.
    fireEvent.press(getAllByLabelText('2026-04-01')[0]);
    expect(onDateSelected).toHaveBeenCalledWith('2026-04-01');
    expect(useScheduleStore.getState().selectedDate).toBe('2026-04-01');
    // The grid must stay on March — tapping an adjacent day no longer auto-advances.
    expect(useScheduleStore.getState().displayMonth).toBe('2026-03-01');
    // The header (visibleDate) also stays on March, not the tapped April day.
    expect(useScheduleStore.getState().visibleDate).toBe('2026-03-01');
  });

  it('fires onMonthChanged with the new month key after a swipe', () => {
    const onMonthChanged = jest.fn();
    const component = render(<MonthGrid onMonthChanged={onMonthChanged} markedDates={{}} />);
    act(() => {
      fireMomentumScrollEnd(component, pageIndexOf('2026-03-01'));
    });
    expect(onMonthChanged).toHaveBeenCalledWith('2026-03-01');
  });

  it('no longer writes visibleDate on swipe (ScheduleScreen owns it via selectDate)', () => {
    const component = render(<MonthGrid markedDates={{}} />);
    const before = useScheduleStore.getState().visibleDate;
    act(() => {
      fireMomentumScrollEnd(component, pageIndexOf('2026-03-01'));
    });
    expect(useScheduleStore.getState().visibleDate).toBe(before);
  });
});
