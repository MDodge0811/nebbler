import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

function todayString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface ScheduleState {
  // Date state
  selectedDate: string;
  visibleDate: string;
  today: string;

  // View state
  isMonthExpanded: boolean;

  // Sync coordination
  isSyncLocked: boolean;

  // Display preferences (persisted)
  cardDisplayMode: Record<string, 'full' | 'compact'>;
  defaultCardMode: 'full' | 'compact';

  // Actions
  selectDate: (date: string) => void;
  setVisibleDate: (date: string) => void;
  setToday: (date: string) => void;
  toggleMonthExpanded: () => void;
  setMonthExpanded: (expanded: boolean) => void;
  setCardMode: (date: string, mode: 'full' | 'compact') => void;
  setDefaultCardMode: (mode: 'full' | 'compact') => void;
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
