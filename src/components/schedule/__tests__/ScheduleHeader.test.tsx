import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { ScheduleHeader } from '../ScheduleHeader';
import { useScheduleStore } from '@stores/useScheduleStore';

const mockDispatch = jest.fn();

jest.mock('@powersync/react', () => ({
  useQuery: jest.fn().mockReturnValue({ data: [], isLoading: false, error: undefined }),
}));

jest.mock('@hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
  }),
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    dispatch: jest.fn(),
    getParent: () => ({ dispatch: mockDispatch }),
  }),
  DrawerActions: { toggleDrawer: () => ({ type: 'TOGGLE_DRAWER' }) },
}));

describe('ScheduleHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useScheduleStore.setState({ visibleDate: '2026-02-23' });
  });

  it('renders the current month name and year', () => {
    render(<ScheduleHeader onNavigateToProfile={jest.fn()} />);
    expect(screen.getByText('February')).toBeTruthy();
    expect(screen.getByText('2026')).toBeTruthy();
  });

  it('renders the user avatar', () => {
    render(<ScheduleHeader onNavigateToProfile={jest.fn()} />);
    expect(screen.getByLabelText('User profile')).toBeTruthy();
  });

  it('renders the overflow menu', () => {
    render(<ScheduleHeader onNavigateToProfile={jest.fn()} />);
    expect(screen.getByLabelText('More options')).toBeTruthy();
  });

  it('calls onNavigateToProfile when avatar is pressed', () => {
    const handleNavigate = jest.fn();
    render(<ScheduleHeader onNavigateToProfile={handleNavigate} />);
    fireEvent.press(screen.getByLabelText('User profile'));
    expect(handleNavigate).toHaveBeenCalledTimes(1);
  });

  it('dispatches toggleDrawer when overflow menu is pressed', () => {
    render(<ScheduleHeader onNavigateToProfile={jest.fn()} />);
    fireEvent.press(screen.getByLabelText('More options'));
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'TOGGLE_DRAWER' });
  });

  it('renders the month and year from visibleDate in the store', () => {
    useScheduleStore.setState({ visibleDate: '2025-06-15' });
    render(<ScheduleHeader onNavigateToProfile={jest.fn()} />);
    expect(screen.getByText('June')).toBeTruthy();
    expect(screen.getByText('2025')).toBeTruthy();
  });

  it('re-renders when visibleDate changes in the store after mount', () => {
    render(<ScheduleHeader onNavigateToProfile={jest.fn()} />);
    expect(screen.getByText('February')).toBeTruthy();

    act(() => {
      useScheduleStore.setState({ visibleDate: '2026-08-10' });
    });

    expect(screen.getByText('August')).toBeTruthy();
    expect(screen.getByText('2026')).toBeTruthy();
  });
});
