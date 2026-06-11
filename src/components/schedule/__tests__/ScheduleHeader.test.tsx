import { render, screen, fireEvent, act } from '@testing-library/react-native';

import { useScheduleStore } from '@stores/useScheduleStore';

import { ScheduleHeader } from '../ScheduleHeader';

describe('ScheduleHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useScheduleStore.setState({ visibleDate: '2026-02-15', starredOnly: false });
  });

  it('renders the current month name and year from visibleDate', () => {
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

  it('renders month/year from visibleDate in the store', () => {
    useScheduleStore.setState({ visibleDate: '2025-06-10' });
    render(<ScheduleHeader />);
    expect(screen.getByText('June')).toBeTruthy();
    expect(screen.getByText('2025')).toBeTruthy();
  });

  it('re-renders when visibleDate changes in the store after mount (week-mode scroll)', () => {
    render(<ScheduleHeader />);
    expect(screen.getByText('February')).toBeTruthy();

    act(() => {
      useScheduleStore.setState({ visibleDate: '2026-08-10' });
    });

    expect(screen.getByText('August')).toBeTruthy();
    expect(screen.getByText('2026')).toBeTruthy();
  });
});
