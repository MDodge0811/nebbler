import { render, screen, fireEvent } from '@testing-library/react-native';
import { ScheduleHeader } from '../ScheduleHeader';

const mockDispatch = jest.fn();

jest.mock('@powersync/react', () => ({
  useQuery: jest.fn().mockReturnValue({ data: [], isLoading: false, error: undefined }),
}));

jest.mock('@hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com', username: 'testuser' },
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
  });

  it('renders the current month name and year', () => {
    const now = new Date();
    const expectedMonth = now.toLocaleDateString('en-US', { month: 'long' });
    const expectedYear = now.getFullYear().toString();
    render(<ScheduleHeader onNavigateToProfile={jest.fn()} />);
    expect(screen.getByText(expectedMonth)).toBeTruthy();
    expect(screen.getByText(expectedYear)).toBeTruthy();
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
});
