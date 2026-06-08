import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { memo } from 'react';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { Text } from '@/components/ui/text';
import { getAvatarColor, getInitials } from '@utils/avatarColor';

const avatarStyle = tva({
  base: 'items-center justify-center rounded-full border-2 border-background-0',
  variants: {
    size: { sm: 'h-4 w-4', md: 'h-6 w-6' },
    first: { true: '', false: '' },
  },
  compoundVariants: [
    { size: 'sm', first: false, class: '-ml-[5px]' },
    { size: 'md', first: false, class: '-ml-2' },
  ],
});

const initialsStyle = tva({
  base: 'font-bold text-typography-white',
  variants: { size: { sm: 'text-[4px]', md: 'text-[8px]' } },
});

const overflowStyle = tva({
  base: 'ml-1 font-semibold text-typography-400',
  variants: { size: { sm: 'text-[6px]', md: 'text-[10px]' } },
});

export interface Attendee {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName: string;
}

interface AttendeeRowProps {
  attendees: Attendee[];
  maxVisible?: number;
  size?: number;
}

export const AttendeeRow = memo(function AttendeeRow({
  attendees,
  maxVisible = 4,
  size = 24,
}: AttendeeRowProps) {
  if (attendees.length === 0) return null;

  const sizeVariant = size <= 16 ? 'sm' : 'md';
  const visible = attendees.slice(0, maxVisible);
  const overflow = attendees.length - maxVisible;

  return (
    <Box className="flex-row items-center" accessibilityLabel={`${attendees.length} attendees`}>
      {visible.map((attendee, index) => {
        const backgroundColor = getAvatarColor(attendee.id);
        const initials = getInitials(attendee.firstName, attendee.lastName, attendee.displayName);
        return (
          <DynamicColorView
            key={attendee.id}
            className={avatarStyle({ size: sizeVariant, first: index === 0 })}
            backgroundColor={backgroundColor}
            zIndex={visible.length - index}
          >
            <Text className={initialsStyle({ size: sizeVariant })}>{initials}</Text>
          </DynamicColorView>
        );
      })}
      {overflow > 0 && <Text className={overflowStyle({ size: sizeVariant })}>+{overflow}</Text>}
    </Box>
  );
});
