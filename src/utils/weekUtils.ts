const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const noon = (s: string) => new Date(s + 'T12:00:00');

/** Returns the Sunday YYYY-MM-DD for the week containing the given date. */
export function getWeekStart(dateString: string): string {
  const d = noon(dateString);
  d.setDate(d.getDate() - d.getDay());
  return fmt(d);
}

/** Returns 7 YYYY-MM-DD strings [Sun..Sat] for the week containing the given date. */
export function getWeekDates(dateString: string): string[] {
  const start = noon(getWeekStart(dateString));
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(fmt(d));
  }
  return dates;
}

/** Shifts a week-start date by `n` weeks (positive = forward, negative = back). */
export function getWeekOffset(weekStart: string, n: number): string {
  const d = noon(weekStart);
  d.setDate(d.getDate() + n * 7);
  return fmt(d);
}

/** Returns the signed integer week difference between two dates (dateA's week - dateB's week). */
export function getWeekDifference(dateA: string, dateB: string): number {
  const startA = noon(getWeekStart(dateA));
  const startB = noon(getWeekStart(dateB));
  const diffMs = startA.getTime() - startB.getTime();
  return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
}

/** Returns the 1st of the month that contains the majority of the given week's days. */
export function getWeekMonth(weekStart: string): string {
  // The Thursday of the week is always in the "dominant" month (ISO convention)
  const d = noon(weekStart);
  d.setDate(d.getDate() + 4); // Sunday + 4 = Thursday
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}
