import { useScheduleStore } from '../useScheduleStore';

// Capture the initial "today" value the store computed at module load
const storeToday = useScheduleStore.getState().today;
const storeDisplayMonth = storeToday.slice(0, 7) + '-01';

describe('useScheduleStore', () => {
  beforeEach(() => {
    useScheduleStore.setState({
      selectedDate: storeToday,
      visibleDate: storeToday,
      today: storeToday,
      viewMode: 'week',
      displayMonth: storeDisplayMonth,
      starredOnly: false,
    });
  });

  it('initializes with today as selectedDate and visibleDate', () => {
    const state = useScheduleStore.getState();
    expect(state.selectedDate).toBe(storeToday);
    expect(state.visibleDate).toBe(storeToday);
    expect(state.today).toBe(storeToday);
  });

  it('selectDate updates both selectedDate and visibleDate but not today', () => {
    useScheduleStore.getState().selectDate('2026-03-15');
    const state = useScheduleStore.getState();
    expect(state.selectedDate).toBe('2026-03-15');
    expect(state.visibleDate).toBe('2026-03-15');
    expect(state.today).toBe(storeToday);
  });

  it('setVisibleDate updates only visibleDate', () => {
    useScheduleStore.getState().selectDate('2026-03-15');
    useScheduleStore.getState().setVisibleDate('2026-04-01');
    const state = useScheduleStore.getState();
    expect(state.selectedDate).toBe('2026-03-15');
    expect(state.visibleDate).toBe('2026-04-01');
  });

  it('setToday updates today', () => {
    useScheduleStore.getState().setToday('2026-12-25');
    expect(useScheduleStore.getState().today).toBe('2026-12-25');
  });

  it('initializes with viewMode week', () => {
    expect(useScheduleStore.getState().viewMode).toBe('week');
  });

  it('setViewMode updates viewMode', () => {
    useScheduleStore.getState().setViewMode('month');
    expect(useScheduleStore.getState().viewMode).toBe('month');
    useScheduleStore.getState().setViewMode('week');
    expect(useScheduleStore.getState().viewMode).toBe('week');
  });

  it('initializes displayMonth from today', () => {
    expect(useScheduleStore.getState().displayMonth).toBe(storeDisplayMonth);
  });

  it('setDisplayMonth updates displayMonth', () => {
    useScheduleStore.getState().setDisplayMonth('2026-04-01');
    expect(useScheduleStore.getState().displayMonth).toBe('2026-04-01');
  });

  // starredOnly — NOT persisted; resets to false on app launch
  it('starredOnly defaults to false', () => {
    expect(useScheduleStore.getState().starredOnly).toBe(false);
  });

  it('toggleStarredOnly flips starredOnly', () => {
    useScheduleStore.getState().toggleStarredOnly();
    expect(useScheduleStore.getState().starredOnly).toBe(true);
    useScheduleStore.getState().toggleStarredOnly();
    expect(useScheduleStore.getState().starredOnly).toBe(false);
  });
});
