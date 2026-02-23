import { getMonthBufferRange, monthKeyOf } from '../dateRange';

describe('getMonthBufferRange', () => {
  it('returns first of previous month to last of next month', () => {
    const { startDate, endDate } = getMonthBufferRange('2026-02-15');
    expect(startDate).toBe('2026-01-01');
    expect(endDate).toBe('2026-03-31');
  });

  it('handles year boundary (January → previous year December)', () => {
    const { startDate, endDate } = getMonthBufferRange('2026-01-10');
    expect(startDate).toBe('2025-12-01');
    expect(endDate).toBe('2026-02-28');
  });

  it('handles year boundary (December → next year January)', () => {
    const { startDate, endDate } = getMonthBufferRange('2025-12-15');
    expect(startDate).toBe('2025-11-01');
    expect(endDate).toBe('2026-01-31');
  });

  it('handles leap year February correctly', () => {
    const result = getMonthBufferRange('2028-01-15');
    // 2028 is a leap year, so Feb has 29 days
    expect(result.endDate).toBe('2028-02-29');
  });

  it('returns consistent results for different days in the same month', () => {
    const first = getMonthBufferRange('2026-06-01');
    const last = getMonthBufferRange('2026-06-30');
    expect(first).toEqual(last);
  });
});

describe('monthKeyOf', () => {
  it('extracts YYYY-MM from a YYYY-MM-DD string', () => {
    expect(monthKeyOf('2026-02-15')).toBe('2026-02');
  });

  it('returns the same key for different days in the same month', () => {
    expect(monthKeyOf('2026-03-01')).toBe(monthKeyOf('2026-03-31'));
  });

  it('returns different keys for different months', () => {
    expect(monthKeyOf('2026-02-15')).not.toBe(monthKeyOf('2026-03-15'));
  });
});
