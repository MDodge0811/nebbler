import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet } from 'react-native';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { CommentChip } from '@components/schedule/cards/CommentChip';
import { StarIndicator } from '@components/schedule/cards/StarIndicator';
import { hexWithAlpha } from '@components/schedule/cards/utils';

const cardStyle = tva({ base: 'mx-4 mb-2 rounded-xl border' });
const bodyStyle = tva({ base: 'flex-row items-center gap-3 px-4 py-2.5' });
const titleStyle = tva({ base: 'flex-1 text-[14.5px] font-semibold text-typography-900' });

const gradientFill = StyleSheet.absoluteFill;

interface AllDayCardProps {
  title: string;
  /** Ignored for all-day display — present for explicit-props contract with EventFeed. */
  timeRange?: string;
  /** Calendar hex — tints the card background and the trailing color tile. */
  tintColor: string;
  starred?: boolean;
  commentCount?: number;
  hasUnreadComments?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

/**
 * Minimal all-day event row: title left, optional comment chip, solid
 * calendar-color tile right. Tinted by calendar color like the timed cards.
 * The parent must NOT have overflow-hidden so the StarIndicator can overflow.
 */
export const AllDayCard = memo(function AllDayCard({
  title,
  tintColor,
  starred,
  commentCount,
  hasUnreadComments,
  onPress,
  onLongPress,
}: AllDayCardProps) {
  const gradientStart = hexWithAlpha(tintColor, 0.14);
  const gradientEnd = hexWithAlpha(tintColor, 0.07);
  const borderColor = hexWithAlpha(tintColor, 0.35);

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} accessibilityRole="button">
      <DynamicColorView className={cardStyle({})} borderColor={borderColor}>
        {/* Tint gradient clipped to the rounded corners; star stays outside the clip. */}
        <Box className="absolute inset-0 overflow-hidden rounded-xl">
          <LinearGradient
            colors={[gradientStart, gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={gradientFill}
          />
        </Box>
        {/* Star overflows the card's top-right corner (card has no overflow-hidden). */}
        {starred === true && <StarIndicator />}
        <HStack className={bodyStyle({})} accessibilityLabel={title}>
          <Text className={titleStyle({})} numberOfLines={1}>
            {title}
          </Text>
          {commentCount !== undefined && commentCount > 0 ? (
            <CommentChip count={commentCount} {...(hasUnreadComments ? { hasUnread: true } : {})} />
          ) : null}
        </HStack>
      </DynamicColorView>
    </Pressable>
  );
});
