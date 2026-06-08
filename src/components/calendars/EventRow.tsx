import Svg, { Path } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { calendarsUIColors } from '@constants/calendarsUI';
import type { Event } from '@database/schema';
import { formatTimeRange, formatEventDateTime } from '@utils/formatTime';

import { RsvpBadge, type RsvpStatus } from './RsvpBadge';

interface EventRowProps {
  event: Event;
  calendarColor: string;
  isFreeBusy: boolean;
  rsvpStatus?: RsvpStatus | null;
  goingCount?: number;
  onPress?: () => void;
}

function ChevronRight() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M6 4L10 8L6 12"
        stroke={calendarsUIColors.textMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function EventRow({
  event,
  calendarColor,
  isFreeBusy,
  rsvpStatus,
  goingCount,
  onPress,
}: EventRowProps) {
  // Free/busy variant shows time only (no weekday/date) to keep it minimal
  const timeText = isFreeBusy
    ? formatTimeRange(event.start_time!, event.end_time!)
    : formatEventDateTime(event.start_time!, event.end_time!);
  const title = isFreeBusy ? 'Busy' : (event.title ?? '');

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 border-b-[0.5px] border-brand-border bg-background-0 px-4 py-3.5"
    >
      <DynamicColorView
        className="h-11 w-1 rounded-[2px]"
        backgroundColor={isFreeBusy ? calendarsUIColors.textMuted : calendarColor}
      />
      <Box className="min-w-0 flex-1">
        <Text numberOfLines={1} className="mb-[3px] text-[15px] font-semibold text-brand-text">
          {title}
        </Text>
        <Text className="text-[13px] text-brand-text-secondary">{timeText}</Text>
      </Box>
      {!isFreeBusy && rsvpStatus ? <RsvpBadge status={rsvpStatus} /> : null}
      {!isFreeBusy && goingCount && goingCount > 0 ? (
        <Text className="text-xs text-brand-text-muted">{goingCount} going</Text>
      ) : null}
      <ChevronRight />
    </Pressable>
  );
}
