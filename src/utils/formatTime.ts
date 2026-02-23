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

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formats a YYYY-MM-DD date string into a section header label.
 * - Today: "Today, Monday Feb 24"
 * - Other: "Tuesday, Feb 25"
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
