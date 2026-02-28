/**
 * Infers whether an event spans an entire day by checking if it starts at
 * midnight and ends at midnight the next day (or later).
 * Used as a heuristic until the schema gains an `is_all_day` column.
 */
export function isAllDayEvent(startTime: string | null, endTime: string | null): boolean {
  if (!startTime || !endTime) return false;

  const start = new Date(startTime);
  const end = new Date(endTime);

  // Check start is midnight UTC
  if (start.getUTCHours() !== 0 || start.getUTCMinutes() !== 0 || start.getUTCSeconds() !== 0) {
    return false;
  }

  // Check end is midnight UTC and at least 24h later
  if (end.getUTCHours() !== 0 || end.getUTCMinutes() !== 0 || end.getUTCSeconds() !== 0) {
    return false;
  }

  const diffMs = end.getTime() - start.getTime();
  return diffMs >= 24 * 60 * 60 * 1000;
}
