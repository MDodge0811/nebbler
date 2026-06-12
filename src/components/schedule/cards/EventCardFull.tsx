import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { AttendeeStack } from '@components/schedule/cards/AttendeeStack';
import { CommentChip } from '@components/schedule/cards/CommentChip';
import { StarIndicator } from '@components/schedule/cards/StarIndicator';
import type { AttendeeChip, EventCardProps } from '@components/schedule/cards/types';
import { hexWithAlpha } from '@components/schedule/cards/utils';

// No shadow — the card reads as a flat, calendar-tinted tile (per design feedback).
const cardStyle = tva({ base: 'mx-4 mb-3 rounded-xl border' });
const bodyStyle = tva({ base: 'flex-row items-center gap-3 px-4 py-3' });
const titleStyle = tva({ base: 'flex-1 text-[15px] font-semibold text-typography-900' });
const timeStyle = tva({ base: 'ml-2 text-[13px] font-medium text-typography-500' });
const locationStyle = tva({ base: 'ml-0.5 flex-1 text-[12px] text-typography-500' });
const metaRowStyle = tva({ base: 'mt-2 flex-row items-center justify-between' });

// StyleSheet.absoluteFill (not .create) is used for LinearGradient — same pattern as existing cards
const gradientFill = StyleSheet.absoluteFill;

function PinIcon() {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke="#9B9BA8"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={10} r={3} stroke="#9B9BA8" strokeWidth={2} />
    </Svg>
  );
}

/**
 * Always-present 44×44 image tile on the card's right edge. When no photo is
 * attached (the current state — photo support is deferred), it shows a solid
 * fill of the event's calendar color so every card carries an unambiguous
 * color anchor.
 */
function PhotoSquare({ tintColor }: { tintColor: string }) {
  return (
    <DynamicColorView
      className="h-11 w-11 self-center rounded-lg"
      backgroundColor={tintColor}
      accessibilityLabel="Event photo"
    />
  );
}

// Explicit `| undefined` so callers can forward `string | undefined` values
// directly under exactOptionalPropertyTypes.
type CardMetaRowProps = {
  location?: string | undefined;
  attendees?: AttendeeChip[] | undefined;
  commentCount?: number | undefined;
  hasUnreadComments?: boolean | undefined;
};

/** Location (left) + attendees and comment chip (right). Renders nothing when empty. */
function CardMetaRow({
  location,
  attendees = [],
  commentCount,
  hasUnreadComments,
}: CardMetaRowProps) {
  const hasMeta = location !== undefined || attendees.length > 0 || (commentCount ?? 0) > 0;
  if (!hasMeta) return null;

  return (
    <HStack className={metaRowStyle({})}>
      {location !== undefined ? (
        <HStack className="flex-1 items-center">
          <PinIcon />
          <Text className={locationStyle({})} numberOfLines={1}>
            {location}
          </Text>
        </HStack>
      ) : (
        <Box className="flex-1" />
      )}

      <HStack className="items-center gap-2">
        {attendees.length > 0 && <AttendeeStack attendees={attendees} />}
        {commentCount !== undefined && commentCount > 0 ? (
          <CommentChip count={commentCount} {...(hasUnreadComments ? { hasUnread: true } : {})} />
        ) : null}
      </HStack>
    </HStack>
  );
}

export const EventCardFull = memo(function EventCardFull({
  title,
  timeRange,
  tintColor,
  starred,
  location,
  attendees,
  commentCount,
  hasUnreadComments,
  onPress,
  onLongPress,
}: EventCardProps) {
  // Soft calendar-color wash — visible but not heavy; the solid PhotoSquare
  // carries the strong color anchor so the background can stay light.
  const gradientStart = hexWithAlpha(tintColor, 0.14);
  const gradientEnd = hexWithAlpha(tintColor, 0.07);
  const borderColor = hexWithAlpha(tintColor, 0.35);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <DynamicColorView className={cardStyle({})} borderColor={borderColor}>
        {/* Tint gradient clipped to the card's rounded corners. The clip lives on
            this wrapper (not the card) so StarIndicator can still overflow. */}
        <Box className="absolute inset-0 overflow-hidden rounded-xl">
          <LinearGradient
            colors={[gradientStart, gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={gradientFill}
          />
        </Box>

        {/* Star overflows top-right corner — card has no overflow-hidden so it shows */}
        {starred === true && <StarIndicator />}

        {/* Body: text column on the left, solid color tile pinned right */}
        <HStack className={bodyStyle({})}>
          <VStack className="flex-1">
            {/* Title left, time top-right */}
            <HStack className="items-start justify-between">
              <Text className={titleStyle({})} numberOfLines={2}>
                {title}
              </Text>
              {timeRange ? <Text className={timeStyle({})}>{timeRange}</Text> : null}
            </HStack>

            {/* Meta row: location left, attendees + comment chip right */}
            <CardMetaRow
              location={location}
              attendees={attendees}
              commentCount={commentCount}
              hasUnreadComments={hasUnreadComments}
            />
          </VStack>

          <PhotoSquare tintColor={tintColor} />
        </HStack>
      </DynamicColorView>
    </Pressable>
  );
});
