import { render, fireEvent, act } from '@testing-library/react-native';
import { WeekStrip } from '../WeekStrip';
import { useScheduleStore } from '@stores/useScheduleStore';

describe('WeekStrip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useScheduleStore.setState({
      selectedDate: '2026-02-24',
      visibleDate: '2026-02-24',
      today: '2026-02-24',
      isSyncLocked: false,
    });
  });

  it('renders without crashing', () => {
    expect(() => render(<WeekStrip markedDates={{}} />)).not.toThrow();
  });

  it('renders day numbers for the current week', () => {
    const { getAllByText } = render(<WeekStrip markedDates={{}} />);
    // 2026-02-24 is a Tuesday; multiple weeks may contain a "24"
    // but at least one should render
    expect(getAllByText('24').length).toBeGreaterThanOrEqual(1);
  });

  it('calls selectDate in the store when a day is tapped', () => {
    const { getByLabelText } = render(<WeekStrip markedDates={{}} />);
    act(() => {
      fireEvent.press(getByLabelText('2026-02-25'));
    });
    expect(useScheduleStore.getState().selectedDate).toBe('2026-02-25');
  });

  it('calls onDateSelected when a day is tapped', () => {
    const onDateSelected = jest.fn();
    const { getByLabelText } = render(
      <WeekStrip markedDates={{}} onDateSelected={onDateSelected} />
    );
    act(() => {
      fireEvent.press(getByLabelText('2026-02-25'));
    });
    expect(onDateSelected).toHaveBeenCalledWith('2026-02-25');
  });

  it('does not call selectDate when isSyncLocked is true', () => {
    useScheduleStore.setState({ isSyncLocked: true });
    const { getByLabelText } = render(<WeekStrip markedDates={{}} />);
    act(() => {
      fireEvent.press(getByLabelText('2026-02-25'));
    });
    expect(useScheduleStore.getState().selectedDate).toBe('2026-02-24');
  });

  it('does not call onDateSelected when isSyncLocked is true', () => {
    useScheduleStore.setState({ isSyncLocked: true });
    const onDateSelected = jest.fn();
    const { getByLabelText } = render(
      <WeekStrip markedDates={{}} onDateSelected={onDateSelected} />
    );
    act(() => {
      fireEvent.press(getByLabelText('2026-02-25'));
    });
    expect(onDateSelected).not.toHaveBeenCalled();
  });

  it('shows event dots for marked dates', () => {
    const markedDates = {
      '2026-02-24': { marked: true as const, dotColor: '#00DB74' },
    };
    const { getAllByTestId } = render(<WeekStrip markedDates={markedDates} />);
    expect(getAllByTestId('event-dot').length).toBeGreaterThanOrEqual(1);
  });
});
