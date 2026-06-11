import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { memo } from 'react';

import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { CommentChip } from '@components/schedule/cards/CommentChip';
import { StarIndicator } from '@components/schedule/cards/StarIndicator';

const cardStyle = tva({
  base: 'mx-4 mb-2 rounded-xl border border-outline-200 bg-background-0 shadow-sm',
});
const bodyStyle = tva({ base: 'flex-row items-center justify-between px-4 py-2.5' });
const titleStyle = tva({ base: 'flex-1 text-[14.5px] font-semibold text-typography-900' });

interface AllDayCardProps {
  title: string;
  /** Ignored for all-day display — present for explicit-props contract with EventFeed. */
  timeRange?: string;
  /** Ignored for all-day tinting — present for explicit-props contract with EventFeed. */
  tintColor?: string;
  starred?: boolean;
  commentCount?: number;
  hasUnreadComments?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

/**
 * Minimal all-day event row: title left, optional comment chip right.
 * The parent must NOT have overflow-hidden so the StarIndicator can overflow.
 */
export const AllDayCard = memo(function AllDayCard({
  title,
  starred,
  commentCount,
  hasUnreadComments,
  onPress,
  onLongPress,
}: AllDayCardProps) {
  return (
    <Pressable
      className={cardStyle({})}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {/* Star overflows the card's top-right corner. Rendered INSIDE the Pressable
          (which carries the mx-4 margins and has no overflow-hidden) so it hugs the
          card corner, not the screen edge — matching EventCardFull/Compact. */}
      {starred === true && <StarIndicator />}
      <HStack className={bodyStyle({})}>
        <Text className={titleStyle({})} numberOfLines={1}>
          {title}
        </Text>
        {commentCount !== undefined && commentCount > 0 ? (
          <CommentChip count={commentCount} {...(hasUnreadComments ? { hasUnread: true } : {})} />
        ) : null}
      </HStack>
    </Pressable>
  );
});
