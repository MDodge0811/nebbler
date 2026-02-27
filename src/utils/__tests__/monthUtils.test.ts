import {
  getMonthGrid,
  getMonthStart,
  getMonthOffset,
  getRowIndexForDate,
  isDateInMonth,
} from '../monthUtils';

describe('getMonthStart', () => {
  it('returns the 1st of the month for a mid-month date', () => {
    expect(getMonthStart('2026-02-15')).toBe('2026-02-01');
  });

  it('returns the same date when given the 1st', () => {
    expect(getMonthStart('2026-03-01')).toBe('2026-03-01');
  });

  it('handles end-of-month dates', () => {
    expect(getMonthStart('2026-01-31')).toBe('2026-01-01');
  });
});

describe('getMonthOffset', () => {
  it('shifts forward by 1 month', () => {
    expect(getMonthOffset('2026-02-01', 1)).toBe('2026-03-01');
  });

  it('shifts backward by 1 month', () => {
    expect(getMonthOffset('2026-03-01', -1)).toBe('2026-02-01');
  });

  it('returns the same month for offset 0', () => {
    expect(getMonthOffset('2026-05-01', 0)).toBe('2026-05-01');
  });

  it('handles year boundary forward', () => {
    expect(getMonthOffset('2026-12-01', 1)).toBe('2027-01-01');
  });

  it('handles year boundary backward', () => {
    expect(getMonthOffset('2026-01-01', -1)).toBe('2025-12-01');
  });

  it('handles multi-month offsets', () => {
    expect(getMonthOffset('2026-01-01', 6)).toBe('2026-07-01');
  });
});

describe('isDateInMonth', () => {
  it('returns true for a date in the given month', () => {
    expect(isDateInMonth('2026-02-15', '2026-02-01')).toBe(true);
  });

  it('returns false for a date in a different month', () => {
    expect(isDateInMonth('2026-03-01', '2026-02-01')).toBe(false);
  });

  it('handles the 1st of the month', () => {
    expect(isDateInMonth('2026-02-01', '2026-02-01')).toBe(true);
  });

  it('handles year differences', () => {
    expect(isDateInMonth('2025-02-15', '2026-02-01')).toBe(false);
  });
});

describe('getMonthGrid', () => {
  it('returns the correct monthKey', () => {
    const grid = getMonthGrid('2026-02-01');
    expect(grid.monthKey).toBe('2026-02-01');
  });

  it('each row has exactly 7 days', () => {
    const grid = getMonthGrid('2026-02-01');
    for (const row of grid.rows) {
      expect(row).toHaveLength(7);
    }
  });

  it('rowCount matches the number of rows', () => {
    const grid = getMonthGrid('2026-02-01');
    expect(grid.rowCount).toBe(grid.rows.length);
  });

  it('first cell is a Sunday (first row starts on Sunday)', () => {
    // Feb 2026 starts on a Sunday
    const grid = getMonthGrid('2026-02-01');
    const firstDate = new Date(grid.rows[0][0] + 'T12:00:00');
    expect(firstDate.getDay()).toBe(0); // Sunday
  });

  it('last cell is a Saturday', () => {
    const grid = getMonthGrid('2026-02-01');
    const lastRow = grid.rows[grid.rows.length - 1];
    const lastDate = new Date(lastRow[6] + 'T12:00:00');
    expect(lastDate.getDay()).toBe(6); // Saturday
  });

  it('contains all days of the month', () => {
    const grid = getMonthGrid('2026-02-01');
    const allDates = grid.rows.flat();
    for (let day = 1; day <= 28; day++) {
      const dateStr = `2026-02-${String(day).padStart(2, '0')}`;
      expect(allDates).toContain(dateStr);
    }
  });

  it('Feb 2026 (starts on Sunday) has 4 rows', () => {
    // Feb 2026: 28 days, starts on Sunday → exactly 4 rows
    const grid = getMonthGrid('2026-02-01');
    expect(grid.rowCount).toBe(4);
  });

  it('March 2026 has 5 rows', () => {
    // March 2026: 31 days, starts on Sunday → 5 rows (31 days, Sun start)
    const grid = getMonthGrid('2026-03-01');
    expect(grid.rowCount).toBe(5);
  });

  it('May 2026 has 6 rows', () => {
    // May 2026: 31 days, starts on Friday → needs 6 rows
    const grid = getMonthGrid('2026-05-01');
    expect(grid.rowCount).toBe(6);
  });

  it('includes leading days from previous month', () => {
    // March 2026 starts on Sunday — no leading days
    const marchGrid = getMonthGrid('2026-03-01');
    expect(marchGrid.rows[0][0]).toBe('2026-03-01');

    // April 2026 starts on Wednesday (dow=3) — 3 leading days
    const aprilGrid = getMonthGrid('2026-04-01');
    expect(aprilGrid.rows[0][0]).toBe('2026-03-29'); // Sun before April 1
    expect(aprilGrid.rows[0][3]).toBe('2026-04-01'); // Wednesday
  });

  it('includes trailing days from next month', () => {
    // Feb 2026: 28 days, starts on Sunday → exactly 4 rows, no trailing
    const febGrid = getMonthGrid('2026-02-01');
    const lastRow = febGrid.rows[febGrid.rows.length - 1];
    expect(lastRow[6]).toBe('2026-02-28');

    // March 2026: 31 days, starts on Sunday → last row ends with trailing April days
    const marchGrid = getMonthGrid('2026-03-01');
    const marchLastRow = marchGrid.rows[marchGrid.rows.length - 1];
    expect(marchLastRow[6]).toBe('2026-04-04');
  });

  it('all dates are consecutive', () => {
    const grid = getMonthGrid('2026-06-01');
    const allDates = grid.rows.flat();
    for (let i = 1; i < allDates.length; i++) {
      const prev = new Date(allDates[i - 1] + 'T12:00:00');
      const curr = new Date(allDates[i] + 'T12:00:00');
      expect(curr.getTime() - prev.getTime()).toBe(24 * 60 * 60 * 1000);
    }
  });
});

describe('getRowIndexForDate', () => {
  it('returns 0 for a date in the first row', () => {
    // Feb 2026 starts on Sunday, so Feb 1 is in row 0
    expect(getRowIndexForDate('2026-02-01', '2026-02-01')).toBe(0);
  });

  it('returns the correct row for a mid-month date', () => {
    // Feb 2026: row 0 = 1-7, row 1 = 8-14, row 2 = 15-21
    expect(getRowIndexForDate('2026-02-15', '2026-02-01')).toBe(2);
  });

  it('returns the last row index for the last day of the month', () => {
    const grid = getMonthGrid('2026-02-01');
    expect(getRowIndexForDate('2026-02-28', '2026-02-01')).toBe(grid.rowCount - 1);
  });

  it('returns 0 for a leading adjacent-month day', () => {
    // April 2026 starts on Wednesday — leading days are March 29, 30, 31
    expect(getRowIndexForDate('2026-03-29', '2026-04-01')).toBe(0);
  });
});
