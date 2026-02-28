const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/**
 * Formats a start/end time pair into a human-readable range.
 * e.g. "2:00 PM – 4:00 PM"
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return `${timeFormatter.format(start)} – ${timeFormatter.format(end)}`;
}

/**
 * Formats a single timestamp into a short time string.
 * e.g. "2:00 PM"
 */
export function formatTimeShort(isoString: string): string {
  return timeFormatter.format(new Date(isoString));
}

const shortWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formats a Date object into a short date string.
 * e.g. "Fri, Feb 28"
 */
export function formatDateShort(date: Date): string {
  return `${shortWeekdays[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Formats a Date object into a short time string.
 * e.g. "3:00 PM"
 */
export function formatTime(date: Date): string {
  return timeFormatter.format(date);
}

/**
 * Formats a YYYY-MM-DD date string into a section header label.
 * - Today: "Today, Tuesday Feb 24"
 * - Other: "Wednesday, Feb 25"
 */
export function formatSectionDate(dateString: string, today: string): string {
  const date = new Date(dateString + 'T12:00:00');
  const weekday = weekdays[date.getDay()];
  const month = months[date.getMonth()];
  const day = date.getDate();

  if (dateString === today) {
    return `Today, ${weekday} ${month} ${day}`;
  }

  return `${weekday}, ${month} ${day}`;
}
