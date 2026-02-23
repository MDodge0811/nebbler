import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

function todayString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

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
  isMonthExpanded: boolean;

  // Sync coordination
  /** Prevents scroll↔date feedback loops during programmatic calendar updates. */
  isSyncLocked: boolean;

  // Display preferences (persisted)
  cardDisplayMode: Record<string, CardMode>;
  defaultCardMode: CardMode;

  // Actions — selectDate sets both selectedDate and visibleDate so the header
  // month stays in sync. setVisibleDate moves only the viewport (month swipe).
  selectDate: (date: string) => void;
  setVisibleDate: (date: string) => void;
  setToday: (date: string) => void;
  toggleMonthExpanded: () => void;
  setMonthExpanded: (expanded: boolean) => void;
  setCardMode: (date: string, mode: CardMode) => void;
  setDefaultCardMode: (mode: CardMode) => void;
  lockSync: () => void;
  unlockSync: () => void;
}

const initialToday = todayString();

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set) => ({
      selectedDate: initialToday,
      visibleDate: initialToday,
      today: initialToday,
      isMonthExpanded: false,
      isSyncLocked: false,
      cardDisplayMode: {},
      defaultCardMode: 'full',

      selectDate: (date) => set({ selectedDate: date, visibleDate: date }),
      setVisibleDate: (date) => set({ visibleDate: date }),
      setToday: (date) => set({ today: date }),
      toggleMonthExpanded: () => set((s) => ({ isMonthExpanded: !s.isMonthExpanded })),
      setMonthExpanded: (expanded) => set({ isMonthExpanded: expanded }),
      setCardMode: (date, mode) =>
        set((s) => ({ cardDisplayMode: { ...s.cardDisplayMode, [date]: mode } })),
      setDefaultCardMode: (mode) => set({ defaultCardMode: mode }),
      lockSync: () => set({ isSyncLocked: true }),
      unlockSync: () => set({ isSyncLocked: false }),
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
