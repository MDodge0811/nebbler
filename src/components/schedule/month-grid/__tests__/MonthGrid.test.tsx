import { render, fireEvent } from '@testing-library/react-native';
import { MonthGrid } from '../MonthGrid';
import { useScheduleStore } from '@stores/useScheduleStore';

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
      isSyncLocked: false,
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

  it('does not respond to day press when sync is locked', () => {
    useScheduleStore.setState({ isSyncLocked: true });
    const onDateSelected = jest.fn();
    const { getByLabelText } = render(
      <MonthGrid onDateSelected={onDateSelected} markedDates={{}} />
    );
    fireEvent.press(getByLabelText(testDate));
    expect(onDateSelected).not.toHaveBeenCalled();
  });
});
