import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { memo } from 'react';
import Svg, { Path } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';

const chipStyle = tva({
  base: 'flex-row items-center rounded-full px-1.5 py-0.5',
  variants: {
    unread: {
      true: 'bg-brand-primary-light',
      false: 'bg-background-100',
    },
  },
});

const countStyle = tva({
  base: 'text-[11px] font-semibold',
  variants: {
    unread: {
      true: 'text-brand-success-text',
      false: 'text-typography-500',
    },
  },
});

const dotStyle = tva({ base: 'mr-0.5 h-1.5 w-1.5 rounded-full bg-brand-primary' });

interface CommentChipProps {
  count: number;
  hasUnread?: boolean;
}

/**
 * Pill showing comment count + optional green unread dot.
 * Returns null when count is 0.
 */
export const CommentChip = memo(function CommentChip({
  count,
  hasUnread = false,
}: CommentChipProps) {
  if (count === 0) return null;

  const iconColor = hasUnread ? '#0A8F4F' : '#6B6B78';

  return (
    <HStack
      className={chipStyle({ unread: hasUnread })}
      accessibilityLabel={`${count} comment${count === 1 ? '' : 's'}${hasUnread ? ', unread' : ''}`}
    >
      {hasUnread && <Box className={dotStyle({})} />}
      <Svg width={11} height={11} viewBox="0 0 24 24">
        <Path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          fill="none"
          stroke={iconColor}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
      <Text className={countStyle({ unread: hasUnread })}>{` ${count}`}</Text>
    </HStack>
  );
});
