import { render } from '@testing-library/react-native';
import { WeekMonthCalendar } from '../WeekMonthCalendar';

jest.mock('@powersync/react', () => ({
  useQuery: jest.fn().mockReturnValue({ data: [], isLoading: false, error: undefined }),
}));

describe('WeekMonthCalendar', () => {
  const defaultProps = {
    selectedDate: '2026-02-15',
    onDateChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<WeekMonthCalendar {...defaultProps} />)).not.toThrow();
  });

  it('accepts an optional onMonthChange callback', () => {
    const onMonthChange = jest.fn();
    expect(() =>
      render(<WeekMonthCalendar {...defaultProps} onMonthChange={onMonthChange} />)
    ).not.toThrow();
  });
});
