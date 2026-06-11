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
      programmaticScrollTarget: null,
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

  it('setProgrammaticScrollTarget sets and clears the target', () => {
    expect(useScheduleStore.getState().programmaticScrollTarget).toBeNull();
    useScheduleStore.getState().setProgrammaticScrollTarget('2026-03-15');
    expect(useScheduleStore.getState().programmaticScrollTarget).toBe('2026-03-15');
    useScheduleStore.getState().setProgrammaticScrollTarget(null);
    expect(useScheduleStore.getState().programmaticScrollTarget).toBeNull();
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

  // starredOnly — NOT persisted (not in partialize); resets to false on app launch
  it('starredOnly defaults to false', () => {
    expect(useScheduleStore.getState().starredOnly).toBe(false);
  });

  it('toggleStarredOnly flips starredOnly', () => {
    useScheduleStore.getState().toggleStarredOnly();
    expect(useScheduleStore.getState().starredOnly).toBe(true);
    useScheduleStore.getState().toggleStarredOnly();
    expect(useScheduleStore.getState().starredOnly).toBe(false);
  });

  it('setStarredOnly sets an explicit value', () => {
    useScheduleStore.getState().setStarredOnly(true);
    expect(useScheduleStore.getState().starredOnly).toBe(true);
    useScheduleStore.getState().setStarredOnly(false);
    expect(useScheduleStore.getState().starredOnly).toBe(false);
  });

  it('starredOnly is NOT in partialize (not persisted)', () => {
    // Access the partialize function via Zustand's persist.getOptions() API.
    // This directly tests that the persisted subset excludes starredOnly.
    type PersistApi = {
      persist: {
        getOptions: () => {
          partialize?: (s: ReturnType<typeof useScheduleStore.getState>) => Record<string, unknown>;
        };
      };
    };
    const { partialize } = (useScheduleStore as unknown as PersistApi).persist.getOptions();
    if (!partialize) throw new Error('partialize must be defined in the persist config');
    const result = partialize(useScheduleStore.getState());
    expect(Object.keys(result)).not.toContain('starredOnly');
    expect(Object.keys(result)).toContain('cardDisplayMode');
    expect(Object.keys(result)).toContain('defaultCardMode');
  });
});
