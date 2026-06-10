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
import type { EventCardProps } from '@components/schedule/cards/types';
import { hexWithAlpha } from '@components/schedule/cards/utils';

const cardStyle = tva({
  base: 'mx-4 mb-3 rounded-xl border shadow-sm',
});
const bodyStyle = tva({ base: 'px-4 py-3' });
const titleStyle = tva({ base: 'text-[15px] font-semibold text-typography-900' });
const timeStyle = tva({ base: 'mt-0.5 text-[13px] font-medium text-typography-500' });
const locationStyle = tva({ base: 'ml-0.5 flex-1 text-[12px] text-typography-400' });
const metaRowStyle = tva({ base: 'mt-2 flex-row items-center justify-between' });

// StyleSheet.absoluteFill (not .create) is used for LinearGradient — same pattern as existing EventCardFull/Busy
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

function PhotoSlot() {
  // Placeholder — renders a neutral 32×32 tile; real image rendering deferred to a future story.
  return <Box className="h-8 w-8 rounded-lg bg-background-100" accessibilityLabel="Event photo" />;
}

export const EventCardFull = memo(function EventCardFull({
  title,
  timeRange,
  tintColor,
  starred,
  location,
  attendees = [],
  commentCount,
  hasUnreadComments,
  photoUri,
  onPress,
  onLongPress,
}: EventCardProps) {
  const gradientStart = hexWithAlpha(tintColor, 0.1);
  const gradientEnd = hexWithAlpha(tintColor, 0.03);
  const borderColor = hexWithAlpha(tintColor, 0.3);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <DynamicColorView className={cardStyle({})} borderColor={borderColor}>
        {/* Tint gradient — absoluteFill via StyleSheet.absoluteFill (same as existing EventCardFull) */}
        <LinearGradient
          colors={[gradientStart, gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={gradientFill}
        />

        {/* Star overflows top-right corner — card has no overflow-hidden so it shows */}
        {starred === true && <StarIndicator />}

        {/* Card body */}
        <VStack className={bodyStyle({})}>
          {/* Title + photo row */}
          <HStack className="items-start justify-between">
            <VStack className="flex-1 pr-2">
              <Text className={titleStyle({})} numberOfLines={2}>
                {title}
              </Text>
              {timeRange ? <Text className={timeStyle({})}>{timeRange}</Text> : null}
            </VStack>
            {photoUri !== undefined ? <PhotoSlot /> : null}
          </HStack>

          {/* Meta row: location left, attendees + comment chip right */}
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
                <CommentChip
                  count={commentCount}
                  {...(hasUnreadComments ? { hasUnread: true } : {})}
                />
              ) : null}
            </HStack>
          </HStack>
        </VStack>
      </DynamicColorView>
    </Pressable>
  );
});
