import { useMemo } from 'react';
import { getWeekStart, getWeekDates, getWeekOffset, getWeekDifference } from '@utils/weekUtils';

export const BUFFER_WEEKS = 6;

export interface WeekPage {
  key: string; // week-start YYYY-MM-DD
  dates: string[]; // 7 YYYY-MM-DD strings [Sun..Sat]
}

export function useWeekPages(anchorDate: string) {
  return useMemo(() => {
    const anchorWeekStart = getWeekStart(anchorDate);
    const totalPages = BUFFER_WEEKS * 2 + 1; // 13
    const centerIndex = BUFFER_WEEKS; // 6

    const weeks: WeekPage[] = [];
    for (let i = -BUFFER_WEEKS; i <= BUFFER_WEEKS; i++) {
      const weekStart = getWeekOffset(anchorWeekStart, i);
      weeks.push({ key: weekStart, dates: getWeekDates(weekStart) });
    }

    function getPageIndexForDate(date: string): number | null {
      const offset = getWeekDifference(date, anchorDate);
      const index = centerIndex + offset;
      if (index < 0 || index >= totalPages) return null;
      return index;
    }

    return { weeks, centerIndex, getPageIndexForDate };
  }, [anchorDate]);
}
