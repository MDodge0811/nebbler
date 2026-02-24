import {
  getWeekStart,
  getWeekDates,
  getWeekOffset,
  getWeekDifference,
  getWeekMonth,
} from '../weekUtils';

describe('getWeekStart', () => {
  it('returns Sunday for a mid-week date', () => {
    // 2026-02-24 is a Tuesday
    expect(getWeekStart('2026-02-24')).toBe('2026-02-22');
  });

  it('returns the same date when given a Sunday', () => {
    expect(getWeekStart('2026-02-22')).toBe('2026-02-22');
  });

  it('returns the previous Sunday for a Saturday', () => {
    expect(getWeekStart('2026-02-28')).toBe('2026-02-22');
  });

  it('handles month boundaries', () => {
    // 2026-03-01 is a Sunday
    expect(getWeekStart('2026-03-01')).toBe('2026-03-01');
    // 2026-03-02 is a Monday
    expect(getWeekStart('2026-03-02')).toBe('2026-03-01');
  });

  it('handles year boundaries', () => {
    // 2026-01-01 is a Thursday
    expect(getWeekStart('2026-01-01')).toBe('2025-12-28');
  });
});

describe('getWeekDates', () => {
  it('returns 7 dates starting from Sunday', () => {
    const dates = getWeekDates('2026-02-24');
    expect(dates).toHaveLength(7);
    expect(dates[0]).toBe('2026-02-22'); // Sunday
    expect(dates[6]).toBe('2026-02-28'); // Saturday
  });

  it('spans month boundary correctly', () => {
    const dates = getWeekDates('2026-02-28');
    expect(dates[0]).toBe('2026-02-22');
    expect(dates[6]).toBe('2026-02-28');
  });

  it('returns consecutive dates', () => {
    const dates = getWeekDates('2026-03-05');
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1] + 'T12:00:00');
      const curr = new Date(dates[i] + 'T12:00:00');
      expect(curr.getTime() - prev.getTime()).toBe(24 * 60 * 60 * 1000);
    }
  });
});

describe('getWeekOffset', () => {
  it('shifts forward by 1 week', () => {
    expect(getWeekOffset('2026-02-22', 1)).toBe('2026-03-01');
  });

  it('shifts backward by 1 week', () => {
    expect(getWeekOffset('2026-02-22', -1)).toBe('2026-02-15');
  });

  it('returns the same date for offset 0', () => {
    expect(getWeekOffset('2026-02-22', 0)).toBe('2026-02-22');
  });

  it('handles multi-week offsets', () => {
    expect(getWeekOffset('2026-02-22', 4)).toBe('2026-03-22');
  });
});

describe('getWeekDifference', () => {
  it('returns 0 for dates in the same week', () => {
    expect(getWeekDifference('2026-02-24', '2026-02-22')).toBe(0);
    expect(getWeekDifference('2026-02-24', '2026-02-28')).toBe(0);
  });

  it('returns positive for future weeks', () => {
    expect(getWeekDifference('2026-03-01', '2026-02-22')).toBe(1);
  });

  it('returns negative for past weeks', () => {
    expect(getWeekDifference('2026-02-15', '2026-02-22')).toBe(-1);
  });

  it('handles multi-week gaps', () => {
    expect(getWeekDifference('2026-03-22', '2026-02-22')).toBe(4);
  });
});

describe('getWeekMonth', () => {
  it('returns the month containing Thursday of the week', () => {
    // Week of 2026-02-22 (Sun) → Thursday is 2026-02-26 → February
    expect(getWeekMonth('2026-02-22')).toBe('2026-02-01');
  });

  it('returns next month when Thursday crosses boundary', () => {
    // Week of 2026-03-29 (Sun) → Thursday is 2026-04-02 → April
    expect(getWeekMonth('2026-03-29')).toBe('2026-04-01');
  });

  it('returns current month when week starts in previous month', () => {
    // Week of 2025-12-28 (Sun) → Thursday is 2026-01-01 → January
    expect(getWeekMonth('2025-12-28')).toBe('2026-01-01');
  });
});
