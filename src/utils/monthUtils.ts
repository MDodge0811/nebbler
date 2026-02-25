const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const noon = (s: string) => new Date(s + 'T12:00:00');

export interface MonthGrid {
  monthKey: string; // YYYY-MM-01
  rows: string[][]; // each row is 7 YYYY-MM-DD strings
  rowCount: number; // 4, 5, or 6
}

/** Returns the first day of the month (YYYY-MM-01) containing the given date. */
export function getMonthStart(dateString: string): string {
  return dateString.slice(0, 7) + '-01';
}

/** Shifts a month key by `n` months (positive = forward, negative = back). */
export function getMonthOffset(monthKey: string, n: number): string {
  const d = noon(monthKey);
  d.setMonth(d.getMonth() + n);
  // Reset to 1st in case of overflow (e.g. Jan 31 + 1 month → Mar 3)
  d.setDate(1);
  return fmt(d);
}

/** Returns the row index (0-based) in the month grid where the given date falls. */
export function getRowIndexForDate(dateString: string, monthKey: string): number {
  const grid = getMonthGrid(monthKey);
  for (let r = 0; r < grid.rows.length; r++) {
    if (grid.rows[r].includes(dateString)) return r;
  }
  return 0;
}

/** Returns true if the date falls within the given month (YYYY-MM-01). */
export function isDateInMonth(dateString: string, monthKey: string): boolean {
  return dateString.slice(0, 7) === monthKey.slice(0, 7);
}

/** Builds a month grid: rows of 7 day strings, padded with leading/trailing days. */
export function getMonthGrid(monthKey: string): MonthGrid {
  const d = noon(monthKey);
  const year = d.getFullYear();
  const month = d.getMonth();

  // Days in this month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Day-of-week of the 1st (0 = Sunday)
  const firstDow = new Date(year, month, 1).getDay();

  // Total cells needed: leading padding + days in month, rounded up to full rows
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;

  const cells: string[] = [];

  // Leading days from previous month
  for (let i = firstDow - 1; i >= 0; i--) {
    const prev = new Date(year, month, -i);
    cells.push(fmt(prev));
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(`${year}-${pad(month + 1)}-${pad(day)}`);
  }

  // Trailing days from next month
  const remaining = totalCells - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const next = new Date(year, month + 1, i);
    cells.push(fmt(next));
  }

  // Group into rows of 7
  const rows: string[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return { monthKey, rows, rowCount: rows.length };
}
