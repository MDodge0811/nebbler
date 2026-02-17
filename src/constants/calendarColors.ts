/**
 * Calendar-specific color constants.
 * Used for react-native-calendars theme customization.
 * Hex values required by react-native-calendars theme API.
 */
export const calendarColors = {
  /** Today indicator — green filled circle */
  today: '#00DB74',
  /** Selected date indicator — blue filled circle */
  selected: '#00B0DB',
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
