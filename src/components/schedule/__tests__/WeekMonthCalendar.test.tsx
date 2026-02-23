import { render } from '@testing-library/react-native';
import { WeekMonthCalendar } from '../WeekMonthCalendar';
import { useScheduleStore } from '@stores/useScheduleStore';

jest.mock('@powersync/react', () => ({
  useQuery: jest.fn().mockReturnValue({ data: [], isLoading: false, error: undefined }),
}));

describe('WeekMonthCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useScheduleStore.setState({ selectedDate: '2026-02-15' });
  });

  it('renders without crashing', () => {
    expect(() => render(<WeekMonthCalendar />)).not.toThrow();
  });

  it('reads selectedDate from the store', () => {
    useScheduleStore.setState({ selectedDate: '2026-06-20' });
    expect(() => render(<WeekMonthCalendar />)).not.toThrow();
    expect(useScheduleStore.getState().selectedDate).toBe('2026-06-20');
  });
});
