import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CalendarsDisplayState {
  hiddenCalendarIds: Record<string, boolean>;
  toggleCalendar: (id: string) => void;
  setGroupVisibility: (calendarIds: string[], visible: boolean) => void;
  isCalendarVisible: (id: string) => boolean;
}

export const useCalendarsDisplayStore = create<CalendarsDisplayState>()(
  persist(
    (set, get) => ({
      hiddenCalendarIds: {},

      toggleCalendar: (id) =>
        set((s) => {
          const next = { ...s.hiddenCalendarIds };
          if (next[id]) {
            delete next[id];
          } else {
            next[id] = true;
          }
          return { hiddenCalendarIds: next };
        }),

      setGroupVisibility: (calendarIds, visible) =>
        set((s) => {
          const next = { ...s.hiddenCalendarIds };
          for (const id of calendarIds) {
            if (visible) {
              delete next[id];
            } else {
              next[id] = true;
            }
          }
          return { hiddenCalendarIds: next };
        }),

      isCalendarVisible: (id) => !get().hiddenCalendarIds[id],
    }),
    {
      name: 'calendars-display-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hiddenCalendarIds: state.hiddenCalendarIds,
      }),
    }
  )
);
