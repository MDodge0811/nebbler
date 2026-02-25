import { renderHook } from '@testing-library/react-native';
import { useMonthPages, BUFFER_MONTHS } from '../useMonthPages';

describe('useMonthPages', () => {
  const anchor = '2026-02-15';

  it('generates the correct number of pages', () => {
    const { result } = renderHook(() => useMonthPages(anchor));
    expect(result.current.months).toHaveLength(BUFFER_MONTHS * 2 + 1);
  });

  it('centers on the anchor date month', () => {
    const { result } = renderHook(() => useMonthPages(anchor));
    const { months, centerIndex } = result.current;
    expect(months[centerIndex].key).toBe('2026-02-01');
  });

  it('months are in chronological order', () => {
    const { result } = renderHook(() => useMonthPages(anchor));
    const { months } = result.current;
    for (let i = 1; i < months.length; i++) {
      expect(months[i].key > months[i - 1].key).toBe(true);
    }
  });

  it('all month keys are unique', () => {
    const { result } = renderHook(() => useMonthPages(anchor));
    const keys = result.current.months.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('each page has a valid grid with rows', () => {
    const { result } = renderHook(() => useMonthPages(anchor));
    for (const page of result.current.months) {
      expect(page.grid.rows.length).toBeGreaterThanOrEqual(4);
      expect(page.grid.rows.length).toBeLessThanOrEqual(6);
      for (const row of page.grid.rows) {
        expect(row).toHaveLength(7);
      }
    }
  });

  describe('getPageIndexForMonth', () => {
    it('returns centerIndex for the anchor month', () => {
      const { result } = renderHook(() => useMonthPages(anchor));
      expect(result.current.getPageIndexForMonth('2026-02-01')).toBe(BUFFER_MONTHS);
    });

    it('returns centerIndex + 1 for next month', () => {
      const { result } = renderHook(() => useMonthPages(anchor));
      expect(result.current.getPageIndexForMonth('2026-03-01')).toBe(BUFFER_MONTHS + 1);
    });

    it('returns centerIndex - 1 for previous month', () => {
      const { result } = renderHook(() => useMonthPages(anchor));
      expect(result.current.getPageIndexForMonth('2026-01-01')).toBe(BUFFER_MONTHS - 1);
    });

    it('returns null for months outside the buffer range', () => {
      const { result } = renderHook(() => useMonthPages(anchor));
      expect(result.current.getPageIndexForMonth('2030-01-01')).toBeNull();
    });

    it('returns 0 for the earliest buffered month', () => {
      const { result } = renderHook(() => useMonthPages(anchor));
      const earliestKey = result.current.months[0].key;
      expect(result.current.getPageIndexForMonth(earliestKey)).toBe(0);
    });
  });
});
