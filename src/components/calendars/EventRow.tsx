import { Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { calendarsUIColors } from '@constants/calendarsUI';
import { formatTimeRange, formatEventDateTime } from '@utils/formatTime';
import { RsvpBadge, type RsvpStatus } from './RsvpBadge';
import type { Event } from '@database/schema';

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
    <Pressable onPress={onPress} style={styles.row}>
      <View
        style={[
          styles.colorBar,
          { backgroundColor: isFreeBusy ? calendarsUIColors.textMuted : calendarColor },
        ]}
      />
      <View style={styles.info}>
        <RNText numberOfLines={1} style={styles.title}>
          {title}
        </RNText>
        <RNText style={styles.time}>{timeText}</RNText>
      </View>
      {!isFreeBusy && rsvpStatus ? <RsvpBadge status={rsvpStatus} /> : null}
      {!isFreeBusy && goingCount && goingCount > 0 ? (
        <RNText style={styles.goingCount}>{goingCount} going</RNText>
      ) : null}
      <ChevronRight />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: calendarsUIColors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: calendarsUIColors.border,
  },
  colorBar: { width: 4, height: 44, borderRadius: 2 },
  info: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '600', color: calendarsUIColors.text, marginBottom: 3 },
  time: { fontSize: 13, color: calendarsUIColors.textSecondary },
  goingCount: { fontSize: 12, color: calendarsUIColors.textMuted },
});
