/**
 * Calendar-specific color constants.
 * Used by the custom WeekStrip calendar and event components.
 */
export const calendarColors = {
  /** Today indicator — green filled circle */
  today: '#00DB74',
  /** Selected date indicator — green filled circle */
  selected: '#00DB74',
  /** Event dot beneath dates with events */
  eventDot: '#00DB74',
  /** Adjacent month dates (grayed out) */
  disabled: '#A3A3A3',
  /** Calendar background */
  background: '#FFFFFF',
  /** Primary date number text */
  dayText: '#262627',
  /** Day-of-week header letters (S, M, T, …) */
  dayHeaderText: '#666666',
} as const;
