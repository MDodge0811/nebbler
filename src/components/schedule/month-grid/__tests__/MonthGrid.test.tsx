import { render, fireEvent } from '@testing-library/react-native';

import { useScheduleStore } from '@stores/useScheduleStore';

import { MonthGrid } from '../MonthGrid';

// The store initializes "today" at module load
const storeToday = useScheduleStore.getState().today;
const storeMonth = storeToday.slice(0, 7);
// Build a specific date in the current month for testing
const testDate = `${storeMonth}-15`;

describe('MonthGrid', () => {
  beforeEach(() => {
    useScheduleStore.setState({
      selectedDate: storeToday,
      visibleDate: storeToday,
      today: storeToday,
      viewMode: 'month',
      displayMonth: storeMonth + '-01',
      programmaticScrollTarget: null,
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

  it('does not respond to day press while programmatic scroll is in flight', () => {
    useScheduleStore.setState({ programmaticScrollTarget: '2026-03-15' });
    const onDateSelected = jest.fn();
    const { getByLabelText } = render(
      <MonthGrid onDateSelected={onDateSelected} markedDates={{}} />
    );
    fireEvent.press(getByLabelText(testDate));
    expect(onDateSelected).not.toHaveBeenCalled();
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
});
