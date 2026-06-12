import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { memo } from 'react';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import type { DayShape } from '@utils/scheduleFeed';

const containerStyle = tva({ base: 'bg-background-0 px-4 pb-1 pt-2' });
const dateTextStyle = tva({ base: 'text-sm font-semibold text-typography-900' });
const summaryTextStyle = tva({ base: 'mt-0.5 text-xs text-typography-500' });

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MON = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** Formats YYYY-MM-DD into a date label.
 *  - Today: "Today · Tue Mar 3"
 *  - Other: "Wed · Mar 4"
 */
function formatDayHeaderDate(dateString: string, today: string): string {
  // noon-pinned to avoid DST boundary issues
  const d = new Date(dateString + 'T12:00:00');
  const dow = DOW[d.getDay()];
  const mon = MON[d.getMonth()];
  const day = d.getDate();
  if (dateString === today) {
    return `Today · ${dow} ${mon} ${day}`;
  }
  return `${dow} · ${mon} ${day}`;
}

/** Renders the DayShape summary as a single line, e.g. "4 events · busy 12–1:30". */
function formatSummaryLine(summary: DayShape): string {
  const parts: string[] = [summary.countLabel];
  if (summary.busyLabel) parts.push(summary.busyLabel);
  if (summary.closerLabel) parts.push(summary.closerLabel);
  return parts.join(' · ');
}

interface DayHeaderRowProps {
  date: string; // YYYY-MM-DD
  today: string; // YYYY-MM-DD
  summary: DayShape;
}

/**
 * Flat day-header row for the FlashList feed.
 * Replaces SectionList sticky headers — rendered as ordinary list rows.
 */
export const DayHeaderRow = memo(function DayHeaderRow({
  date,
  today,
  summary,
}: DayHeaderRowProps) {
  const dateLabel = formatDayHeaderDate(date, today);
  const summaryLine = formatSummaryLine(summary);

  return (
    <Box className={containerStyle({})}>
      <Text className={dateTextStyle({})}>{dateLabel}</Text>
      <Text className={summaryTextStyle({})}>{summaryLine}</Text>
    </Box>
  );
});
