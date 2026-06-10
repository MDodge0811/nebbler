import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { memo } from 'react';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { CommentChip } from '@components/schedule/cards/CommentChip';

const cardStyle = tva({
  base: 'mx-4 mb-2 rounded-xl border border-outline-200 bg-background-0 shadow-sm',
});
const bodyStyle = tva({ base: 'flex-row items-center justify-between px-4 py-2.5' });
const titleStyle = tva({ base: 'flex-1 text-[14.5px] font-semibold text-typography-900' });

interface AllDayCardProps {
  title: string;
  commentCount?: number;
  hasUnreadComments?: boolean;
  onPress?: () => void;
}

/**
 * Minimal all-day event row: title left, optional comment chip right.
 * No time, location, attendees, or photo.
 */
export const AllDayCard = memo(function AllDayCard({
  title,
  commentCount,
  hasUnreadComments,
  onPress: _onPress,
}: AllDayCardProps) {
  return (
    <Box className={cardStyle({})}>
      <HStack className={bodyStyle({})}>
        <Text className={titleStyle({})} numberOfLines={1}>
          {title}
        </Text>
        {commentCount !== undefined && commentCount > 0 ? (
          <CommentChip count={commentCount} {...(hasUnreadComments ? { hasUnread: true } : {})} />
        ) : null}
      </HStack>
    </Box>
  );
});
