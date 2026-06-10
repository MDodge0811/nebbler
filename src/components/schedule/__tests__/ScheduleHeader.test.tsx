import { render, screen, fireEvent, act } from '@testing-library/react-native';

import { useScheduleStore } from '@stores/useScheduleStore';

import { ScheduleHeader } from '../ScheduleHeader';

describe('ScheduleHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useScheduleStore.setState({ displayMonth: '2026-02-01', starredOnly: false });
  });

  it('renders the current month name and year from displayMonth', () => {
    render(<ScheduleHeader />);
    expect(screen.getByText('February')).toBeTruthy();
    expect(screen.getByText('2026')).toBeTruthy();
  });

  it('renders the star filter button', () => {
    render(<ScheduleHeader />);
    expect(screen.getByLabelText('Star filter')).toBeTruthy();
  });

  it('renders the search button', () => {
    render(<ScheduleHeader />);
    expect(screen.getByLabelText('Search')).toBeTruthy();
  });

  it('search button onPress is a no-op (does not throw)', () => {
    render(<ScheduleHeader />);
    expect(() => fireEvent.press(screen.getByLabelText('Search'))).not.toThrow();
  });

  it('does NOT render a profile button or onNavigateToProfile', () => {
    render(<ScheduleHeader />);
    expect(screen.queryByLabelText('User profile')).toBeNull();
  });

  it('star filter button is inactive by default (label = "Star filter")', () => {
    render(<ScheduleHeader />);
    expect(screen.getByLabelText('Star filter')).toBeTruthy();
  });

  it('pressing star filter toggles starredOnly in the store', () => {
    render(<ScheduleHeader />);
    expect(useScheduleStore.getState().starredOnly).toBe(false);
    fireEvent.press(screen.getByLabelText('Star filter'));
    expect(useScheduleStore.getState().starredOnly).toBe(true);
  });

  it('shows active label when starredOnly is true', () => {
    act(() => {
      useScheduleStore.setState({ starredOnly: true });
    });
    render(<ScheduleHeader />);
    expect(screen.getByLabelText('Star filter active')).toBeTruthy();
  });

  it('pressing active star filter toggles it back off', () => {
    act(() => {
      useScheduleStore.setState({ starredOnly: true });
    });
    render(<ScheduleHeader />);
    fireEvent.press(screen.getByLabelText('Star filter active'));
    expect(useScheduleStore.getState().starredOnly).toBe(false);
  });

  it('renders month/year from displayMonth in the store', () => {
    useScheduleStore.setState({ displayMonth: '2025-06-01' });
    render(<ScheduleHeader />);
    expect(screen.getByText('June')).toBeTruthy();
    expect(screen.getByText('2025')).toBeTruthy();
  });

  it('re-renders when displayMonth changes in the store after mount', () => {
    render(<ScheduleHeader />);
    expect(screen.getByText('February')).toBeTruthy();

    act(() => {
      useScheduleStore.setState({ displayMonth: '2026-08-01' });
    });

    expect(screen.getByText('August')).toBeTruthy();
    expect(screen.getByText('2026')).toBeTruthy();
  });
});
