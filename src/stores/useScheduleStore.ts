import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

function todayString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toMonthStart(dateString: string): string {
  return dateString.slice(0, 7) + '-01';
}

export type ViewMode = 'week' | 'month';
type CardMode = 'full' | 'compact';

interface ScheduleState {
  // Date state
  /** The date the user last tapped (drives the event list below the calendar). */
  selectedDate: string;
  /** The month currently visible in the calendar (may differ from selectedDate during month swiping). */
  visibleDate: string;
  /** Wall-clock today, set at launch and updated on midnight rollover. */
  today: string;

  // View state
  viewMode: ViewMode;
  /** The month currently shown in MonthGrid (YYYY-MM-01). */
  displayMonth: string;

  // Star filter — NOT persisted; resets to false on app launch.
  /** When true, the feed shows only starred events. */
  starredOnly: boolean;

  // Lock-free scroll sync — when non-null, a programmatic scroll is in flight.
  // viewable-items callbacks are suppressed until this is cleared.
  programmaticScrollTarget: string | null;

  // Display preferences (persisted)
  cardDisplayMode: Record<string, CardMode>;
  defaultCardMode: CardMode;

  // Actions — selectDate sets both selectedDate and visibleDate so the header
  // month stays in sync. setVisibleDate moves only the viewport (month swipe).
  selectDate: (date: string) => void;
  setVisibleDate: (date: string) => void;
  setToday: (date: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setDisplayMonth: (month: string) => void;
  setCardMode: (date: string, mode: CardMode) => void;
  setDefaultCardMode: (mode: CardMode) => void;
  setProgrammaticScrollTarget: (date: string | null) => void;
  toggleStarredOnly: () => void;
  setStarredOnly: (value: boolean) => void;
}

const initialToday = todayString();

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set) => ({
      selectedDate: initialToday,
      visibleDate: initialToday,
      today: initialToday,
      viewMode: 'week',
      displayMonth: toMonthStart(initialToday),
      starredOnly: false,
      programmaticScrollTarget: null,
      cardDisplayMode: {},
      defaultCardMode: 'full',

      selectDate: (date) => set({ selectedDate: date, visibleDate: date }),
      setVisibleDate: (date) => set({ visibleDate: date }),
      setToday: (date) => set({ today: date }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setDisplayMonth: (month) => set({ displayMonth: month }),
      setCardMode: (date, mode) =>
        set((s) => ({ cardDisplayMode: { ...s.cardDisplayMode, [date]: mode } })),
      setDefaultCardMode: (mode) => set({ defaultCardMode: mode }),
      setProgrammaticScrollTarget: (date) => set({ programmaticScrollTarget: date }),
      toggleStarredOnly: () => set((s) => ({ starredOnly: !s.starredOnly })),
      setStarredOnly: (value) => set({ starredOnly: value }),
    }),
    {
      name: 'schedule-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        cardDisplayMode: state.cardDisplayMode,
        defaultCardMode: state.defaultCardMode,
      }),
    }
  )
);
