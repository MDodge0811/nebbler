/**
 * Formats a Date object into a local 12-hour time string.
 * Uses Date.getHours()/getMinutes() which always return local time,
 * avoiding Hermes Intl.DateTimeFormat timezone issues.
 * e.g. "3:00 PM"
 */
function formatLocalTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = String(minutes).padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Formats a start/end time pair into a human-readable range.
 * e.g. "2:00 PM – 4:00 PM"
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return `${formatLocalTime(start)} – ${formatLocalTime(end)}`;
}

/**
 * Formats a single ISO timestamp into a short time string.
 * e.g. "2:00 PM"
 */
export function formatTimeShort(isoString: string): string {
  return formatLocalTime(new Date(isoString));
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
  return formatLocalTime(date);
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
