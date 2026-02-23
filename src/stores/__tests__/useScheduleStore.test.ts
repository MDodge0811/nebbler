import { useScheduleStore } from '../useScheduleStore';

// Capture the initial "today" value the store computed at module load
const storeToday = useScheduleStore.getState().today;

describe('useScheduleStore', () => {
  beforeEach(() => {
    useScheduleStore.setState({
      selectedDate: storeToday,
      visibleDate: storeToday,
      today: storeToday,
      isMonthExpanded: false,
      isSyncLocked: false,
      cardDisplayMode: {},
      defaultCardMode: 'full',
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

  it('toggleMonthExpanded flips the boolean', () => {
    expect(useScheduleStore.getState().isMonthExpanded).toBe(false);
    useScheduleStore.getState().toggleMonthExpanded();
    expect(useScheduleStore.getState().isMonthExpanded).toBe(true);
    useScheduleStore.getState().toggleMonthExpanded();
    expect(useScheduleStore.getState().isMonthExpanded).toBe(false);
  });

  it('setMonthExpanded sets the value directly', () => {
    useScheduleStore.getState().setMonthExpanded(true);
    expect(useScheduleStore.getState().isMonthExpanded).toBe(true);
    useScheduleStore.getState().setMonthExpanded(false);
    expect(useScheduleStore.getState().isMonthExpanded).toBe(false);
  });

  it('lockSync and unlockSync toggle isSyncLocked', () => {
    expect(useScheduleStore.getState().isSyncLocked).toBe(false);
    useScheduleStore.getState().lockSync();
    expect(useScheduleStore.getState().isSyncLocked).toBe(true);
    useScheduleStore.getState().unlockSync();
    expect(useScheduleStore.getState().isSyncLocked).toBe(false);
  });

  it('setCardMode stores per-date preferences', () => {
    useScheduleStore.getState().setCardMode('2026-03-15', 'compact');
    useScheduleStore.getState().setCardMode('2026-03-16', 'full');
    const state = useScheduleStore.getState();
    expect(state.cardDisplayMode['2026-03-15']).toBe('compact');
    expect(state.cardDisplayMode['2026-03-16']).toBe('full');
  });

  it('setCardMode overwrites a key without losing other entries', () => {
    useScheduleStore.getState().setCardMode('2026-03-15', 'compact');
    useScheduleStore.getState().setCardMode('2026-03-16', 'full');
    useScheduleStore.getState().setCardMode('2026-03-15', 'full');
    const state = useScheduleStore.getState();
    expect(state.cardDisplayMode['2026-03-15']).toBe('full');
    expect(state.cardDisplayMode['2026-03-16']).toBe('full');
  });

  it('setDefaultCardMode updates the default', () => {
    expect(useScheduleStore.getState().defaultCardMode).toBe('full');
    useScheduleStore.getState().setDefaultCardMode('compact');
    expect(useScheduleStore.getState().defaultCardMode).toBe('compact');
  });
});
