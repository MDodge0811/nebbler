import { render, fireEvent, act } from '@testing-library/react-native';

import { useScheduleStore } from '@stores/useScheduleStore';

import { WeekStrip } from '../WeekStrip';
import type { WeekStripDayCellProps } from '../WeekStripDayCell';

// Capture rendered cell props keyed by dateString for reference-stability assertions.
// Must be prefixed with "mock" so Jest's hoisted factory scope check allows the reference.
const mockCapturedCellProps = new Map<string, WeekStripDayCellProps>();

// jest.mock factories are hoisted before imports, so we must use require() inside them.
jest.mock('../WeekStripDayCell', () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- require() needed inside hoisted jest.mock factory
  const { Pressable, Text, View } = require('react-native') as typeof import('react-native');

  return {
    WeekStripDayCell: (props: WeekStripDayCellProps) => {
      mockCapturedCellProps.set(props.dateString, props);
      // Minimal render so existing tests querying by accessibilityLabel,
      // day-number text, and testID="event-dot" still work.
      return (
        <Pressable
          onPress={() => props.onPress(props.dateString)}
          accessibilityRole="button"
          accessibilityLabel={props.dateString}
        >
          <Text>{props.dayNumber}</Text>
          {props.dotColors.map((color: string, i: number) => (
            <View key={i} testID="event-dot" style={{ backgroundColor: color }} />
          ))}
        </Pressable>
      );
    },
  };
});

// A date in the week of 2026-02-24 that has no marks (all dates unmarked for most tests).
// 2026-02-24 is a Tuesday; 2026-02-23 (Monday) is in the same week and will never be marked.
const unmarkedDate = '2026-02-23';

describe('WeekStrip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCapturedCellProps.clear();
    useScheduleStore.setState({
      selectedDate: '2026-02-24',
      visibleDate: '2026-02-24',
      today: '2026-02-24',
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

  it('shows event dots for marked dates (new colors shape)', () => {
    const markedDates = {
      '2026-02-24': { colors: ['#00DB74'], starred: false },
    };
    const { getAllByTestId } = render(<WeekStrip markedDates={markedDates} />);
    expect(getAllByTestId('event-dot').length).toBeGreaterThanOrEqual(1);
  });

  it('passes a stable dotColors reference for unmarked days across re-renders', () => {
    const { rerender } = render(<WeekStrip markedDates={{}} />);
    const first = mockCapturedCellProps.get(unmarkedDate)?.dotColors;
    rerender(<WeekStrip markedDates={{}} />);
    const second = mockCapturedCellProps.get(unmarkedDate)?.dotColors;
    expect(second).toBe(first); // same reference → memo() can bail
  });
});
