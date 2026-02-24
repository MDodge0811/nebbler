import { render, fireEvent } from '@testing-library/react-native';
import { WeekStripDayCell } from '../WeekStripDayCell';
import { calendarColors } from '@constants/calendarColors';

const defaultProps = {
  dateString: '2026-02-24',
  dayNumber: 24,
  isSelected: false,
  isToday: false,
  hasEvent: false,
  dotColor: calendarColors.eventDot,
  onPress: jest.fn(),
};

describe('WeekStripDayCell', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the day number', () => {
    const { getByText } = render(<WeekStripDayCell {...defaultProps} />);
    expect(getByText('24')).toBeTruthy();
  });

  it('calls onPress with the dateString when tapped', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<WeekStripDayCell {...defaultProps} onPress={onPress} />);
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledWith('2026-02-24');
  });

  it('does not show an event dot when hasEvent is false', () => {
    const { queryByTestId } = render(<WeekStripDayCell {...defaultProps} />);
    expect(queryByTestId('event-dot')).toBeNull();
  });

  it('shows an event dot when hasEvent is true', () => {
    const { getByTestId } = render(<WeekStripDayCell {...defaultProps} hasEvent />);
    expect(getByTestId('event-dot')).toBeTruthy();
  });

  it('renders with selected style (blue circle, white text)', () => {
    const { getByText } = render(<WeekStripDayCell {...defaultProps} isSelected />);
    const text = getByText('24');
    expect(text.props.style).toEqual(expect.objectContaining({ color: '#FFFFFF' }));
  });

  it('renders with today style (green circle, white text) when not selected', () => {
    const { getByText } = render(<WeekStripDayCell {...defaultProps} isToday />);
    const text = getByText('24');
    expect(text.props.style).toEqual(expect.objectContaining({ color: '#FFFFFF' }));
  });

  it('renders with normal style (day text color) when not selected and not today', () => {
    const { getByText } = render(<WeekStripDayCell {...defaultProps} />);
    const text = getByText('24');
    expect(text.props.style).toEqual(expect.objectContaining({ color: calendarColors.dayText }));
  });

  it('selected takes priority over today', () => {
    const { getByText } = render(<WeekStripDayCell {...defaultProps} isSelected isToday />);
    // Both result in white text, but the circle should be selected color (blue)
    const text = getByText('24');
    expect(text.props.style).toEqual(expect.objectContaining({ color: '#FFFFFF' }));
  });
});
