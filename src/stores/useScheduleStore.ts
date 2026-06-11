import { create } from 'zustand';

function todayString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toMonthStart(dateString: string): string {
  return dateString.slice(0, 7) + '-01';
}

export type ViewMode = 'week' | 'month';

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

  // Actions — selectDate sets both selectedDate and visibleDate so the header
  // month stays in sync. setVisibleDate moves only the viewport (month swipe).
  selectDate: (date: string) => void;
  setVisibleDate: (date: string) => void;
  setToday: (date: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setDisplayMonth: (month: string) => void;
  toggleStarredOnly: () => void;
}

const initialToday = todayString();

export const useScheduleStore = create<ScheduleState>()((set) => ({
  selectedDate: initialToday,
  visibleDate: initialToday,
  today: initialToday,
  viewMode: 'week',
  displayMonth: toMonthStart(initialToday),
  starredOnly: false,

  selectDate: (date) => set({ selectedDate: date, visibleDate: date }),
  setVisibleDate: (date) => set({ visibleDate: date }),
  setToday: (date) => set({ today: date }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setDisplayMonth: (month) => set({ displayMonth: month }),
  toggleStarredOnly: () => set((s) => ({ starredOnly: !s.starredOnly })),
}));
