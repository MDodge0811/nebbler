import { useMemo } from 'react';
import { getMonthStart, getMonthOffset, getMonthGrid, type MonthGrid } from '@utils/monthUtils';

export const BUFFER_MONTHS = 6;

export interface MonthPage {
  key: string; // YYYY-MM-01
  grid: MonthGrid;
}

export function useMonthPages(anchorDate: string) {
  return useMemo(() => {
    const anchorMonth = getMonthStart(anchorDate);
    const totalPages = BUFFER_MONTHS * 2 + 1; // 13
    const centerIndex = BUFFER_MONTHS; // 6

    const months: MonthPage[] = [];
    for (let i = -BUFFER_MONTHS; i <= BUFFER_MONTHS; i++) {
      const monthKey = getMonthOffset(anchorMonth, i);
      months.push({ key: monthKey, grid: getMonthGrid(monthKey) });
    }

    function getPageIndexForMonth(monthKey: string): number | null {
      const index = months.findIndex((m) => m.key === monthKey);
      if (index === -1) return null;
      return index;
    }

    return { months, centerIndex, totalPages, getPageIndexForMonth };
  }, [anchorDate]);
}
