const CALENDAR_COLORS = [
  '#FFB3B3', // soft red
  '#B3F0D4', // soft green
  '#B3E5F6', // soft blue
  '#FFD6A8', // soft orange
  '#D4B3F7', // soft purple
  '#F7B3D9', // soft pink
  '#B3E8E0', // soft teal
  '#FDE6A8', // soft yellow
];

/**
 * Returns a deterministic pastel color for a calendar based on its ID.
 * Stubs in for the missing `calendars.color` schema field — once that column
 * exists, callers should prefer the stored color and fall back to this.
 */
export function getCalendarColor(calendarId: string): string {
  let hash = 0;
  for (let i = 0; i < calendarId.length; i++) {
    hash = hash + calendarId.charCodeAt(i);
  }
  return CALENDAR_COLORS[hash % CALENDAR_COLORS.length];
}
