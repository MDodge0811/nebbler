const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Compute a ±1 month buffer around the given YYYY-MM-DD date.
 * Returns the first day of the previous month and the last day of the next month.
 */
export function getMonthBufferRange(dateString: string) {
  const date = new Date(dateString + 'T12:00:00');
  const year = date.getFullYear();
  const month = date.getMonth();

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month + 2, 0); // last day of next month

  return { startDate: fmt(start), endDate: fmt(end) };
}

/**
 * Extract the YYYY-MM portion of a YYYY-MM-DD string.
 * Useful for memoizing computations that only need to change per-month.
 */
export function monthKeyOf(dateString: string): string {
  return dateString.slice(0, 7);
}
