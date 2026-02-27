import { renderHook } from '@testing-library/react-native';
import { useWeekPages, BUFFER_WEEKS } from '../useWeekPages';

describe('useWeekPages', () => {
  const anchor = '2026-02-24'; // Tuesday

  it('generates the correct number of pages', () => {
    const { result } = renderHook(() => useWeekPages(anchor));
    expect(result.current.weeks).toHaveLength(BUFFER_WEEKS * 2 + 1);
  });

  it('centers on the anchor date week', () => {
    const { result } = renderHook(() => useWeekPages(anchor));
    const { weeks, centerIndex } = result.current;
    const centerWeek = weeks[centerIndex];
    // 2026-02-24 is a Tuesday; its week starts on 2026-02-22 (Sunday)
    expect(centerWeek.key).toBe('2026-02-22');
    expect(centerWeek.dates).toContain('2026-02-24');
  });

  it('each week page has 7 dates', () => {
    const { result } = renderHook(() => useWeekPages(anchor));
    for (const week of result.current.weeks) {
      expect(week.dates).toHaveLength(7);
    }
  });

  it('weeks are in chronological order', () => {
    const { result } = renderHook(() => useWeekPages(anchor));
    const { weeks } = result.current;
    for (let i = 1; i < weeks.length; i++) {
      expect(weeks[i].key > weeks[i - 1].key).toBe(true);
    }
  });

  it('all week keys are unique', () => {
    const { result } = renderHook(() => useWeekPages(anchor));
    const keys = result.current.weeks.map((w) => w.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  describe('getPageIndexForDate', () => {
    it('returns centerIndex for the anchor date', () => {
      const { result } = renderHook(() => useWeekPages(anchor));
      expect(result.current.getPageIndexForDate('2026-02-24')).toBe(BUFFER_WEEKS);
    });

    it('returns centerIndex for other dates in the same week', () => {
      const { result } = renderHook(() => useWeekPages(anchor));
      // Sunday of the same week
      expect(result.current.getPageIndexForDate('2026-02-22')).toBe(BUFFER_WEEKS);
    });

    it('returns centerIndex + 1 for next week', () => {
      const { result } = renderHook(() => useWeekPages(anchor));
      expect(result.current.getPageIndexForDate('2026-03-01')).toBe(BUFFER_WEEKS + 1);
    });

    it('returns centerIndex - 1 for previous week', () => {
      const { result } = renderHook(() => useWeekPages(anchor));
      expect(result.current.getPageIndexForDate('2026-02-15')).toBe(BUFFER_WEEKS - 1);
    });

    it('returns null for dates outside the buffer range', () => {
      const { result } = renderHook(() => useWeekPages(anchor));
      // Way in the future
      expect(result.current.getPageIndexForDate('2027-01-01')).toBeNull();
      // Way in the past
      expect(result.current.getPageIndexForDate('2025-01-01')).toBeNull();
    });

    it('returns 0 for the earliest buffered week', () => {
      const { result } = renderHook(() => useWeekPages(anchor));
      const earliestKey = result.current.weeks[0].key;
      expect(result.current.getPageIndexForDate(earliestKey)).toBe(0);
    });
  });
});
