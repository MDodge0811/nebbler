import { render, fireEvent } from '@testing-library/react-native';

import { calendarColors } from '@constants/calendarColors';

import { WeekStripDayCell } from '../WeekStripDayCell';

const defaultProps = {
  dateString: '2026-02-24',
  dayNumber: 24,
  isSelected: false,
  isToday: false,
  dotColors: [] as string[],
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

  it('does not show an event dot when dotColors is empty', () => {
    const { queryByTestId } = render(<WeekStripDayCell {...defaultProps} dotColors={[]} />);
    expect(queryByTestId('event-dot')).toBeNull();
  });

  it('shows one event dot for a single color', () => {
    const { getAllByTestId } = render(
      <WeekStripDayCell {...defaultProps} dotColors={['#00DB74']} />
    );
    expect(getAllByTestId('event-dot').length).toBe(1);
  });

  it('shows up to 4 dots and caps at 4', () => {
    const { getAllByTestId } = render(
      <WeekStripDayCell
        {...defaultProps}
        dotColors={['#00DB74', '#FFB3B3', '#B3E5F6', '#D4B3F7', '#FCD34D']}
      />
    );
    // Must cap at 4, not 5
    expect(getAllByTestId('event-dot').length).toBe(4);
  });

  // NEB-35 regression: selected = filled pill + white text
  it('renders with selected style (green filled pill, white text) when selected', () => {
    const { getByText } = render(<WeekStripDayCell {...defaultProps} isSelected />);
    const text = getByText('24') as { props: { style: unknown } };
    expect(text.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#FFFFFF' })])
    );
  });

  // NEB-35 regression: today (not selected) = green numeral only, NO ring/pill
  it('renders green numeral (no pill/ring) for today when not selected', () => {
    const { getByText } = render(<WeekStripDayCell {...defaultProps} isToday />);
    const text = getByText('24') as { props: { style: unknown } };
    // Text color must be the today green
    expect(text.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: calendarColors.today })])
    );
  });

  it('renders normal day text color when not selected and not today', () => {
    const { getByText } = render(<WeekStripDayCell {...defaultProps} />);
    const text = getByText('24') as { props: { style: unknown } };
    expect(text.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: calendarColors.dayText })])
    );
  });

  it('selected takes priority over today (white text, filled pill)', () => {
    const { getByText } = render(<WeekStripDayCell {...defaultProps} isSelected isToday />);
    const text = getByText('24') as { props: { style: unknown } };
    expect(text.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#FFFFFF' })])
    );
  });

  // Star marker tests
  it('does not show star marker when starred is false', () => {
    const { queryByTestId } = render(<WeekStripDayCell {...defaultProps} starred={false} />);
    expect(queryByTestId('star-marker')).toBeNull();
  });

  it('shows star marker when starred is true', () => {
    const { getByTestId } = render(<WeekStripDayCell {...defaultProps} starred />);
    expect(getByTestId('star-marker')).toBeTruthy();
  });

  it('does not show star marker on adjacent month even when starred', () => {
    const { queryByTestId } = render(
      <WeekStripDayCell {...defaultProps} starred isAdjacentMonth />
    );
    expect(queryByTestId('star-marker')).toBeNull();
  });

  describe('isAdjacentMonth', () => {
    it('renders with disabled color when isAdjacentMonth is true', () => {
      const { getByText } = render(<WeekStripDayCell {...defaultProps} isAdjacentMonth />);
      const text = getByText('24') as { props: { style: unknown } };
      expect(text.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ color: calendarColors.disabled })])
      );
    });

    it('shows selected styling (white text) even when isAdjacentMonth is true', () => {
      // Selection now wins over adjacent-month fading: tapping an adjacent day
      // keeps the grid put, so the selected indicator must stay visible on it.
      const { getByText } = render(
        <WeekStripDayCell {...defaultProps} isSelected isAdjacentMonth />
      );
      const text = getByText('24') as { props: { style: unknown } };
      expect(text.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ color: '#FFFFFF' })])
      );
    });

    it('overrides today styling when isAdjacentMonth is true', () => {
      const { getByText } = render(<WeekStripDayCell {...defaultProps} isToday isAdjacentMonth />);
      const text = getByText('24') as { props: { style: unknown } };
      expect(text.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ color: calendarColors.disabled })])
      );
    });

    it('is still tappable when isAdjacentMonth is true', () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <WeekStripDayCell {...defaultProps} isAdjacentMonth onPress={onPress} />
      );
      fireEvent.press(getByRole('button'));
      expect(onPress).toHaveBeenCalledWith('2026-02-24');
    });
  });
});
