import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { memo } from 'react';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { Text } from '@/components/ui/text';
import type { AttendeeChip } from '@components/schedule/cards/types';

/** RSVP ring colors from mockup */
const RING_GOING = '#00DB74';
const RING_PENDING = '#C7C7CF';

// Dimensions are fixed (avatar 18 + 2px white gap + 3px ring → outer 28 / inner 22),
// so they're static NativeWind classes rather than runtime inline styles — only the
// ring/avatar *colors* and zIndex are data-driven (the DynamicColorView door).
const ringStyle = tva({
  base: 'h-[28px] w-[28px] items-center justify-center rounded-full',
  variants: { overlap: { true: '-ml-[5px]' } },
});
const gapStyle = tva({
  base: 'h-[22px] w-[22px] items-center justify-center overflow-hidden rounded-full bg-background-0',
});
const avatarStyle = tva({
  base: 'h-[18px] w-[18px] items-center justify-center overflow-hidden rounded-full',
});
const initialsStyle = tva({ base: 'text-[7px] font-bold text-typography-white' });

interface AttendeeStackProps {
  attendees: AttendeeChip[];
  maxVisible?: number;
}

/**
 * Overlapping avatar stack with per-attendee RSVP rings.
 *
 * Because box-shadow isn't cross-platform in RN, the ring is two concentric
 * circles: an outer DynamicColorView (ring color) → a white-gap Box → the avatar
 * DynamicColorView (attendee color). Sizes are static classes; colors/zIndex use
 * the sanctioned DynamicColorView door.
 */
export const AttendeeStack = memo(function AttendeeStack({
  attendees,
  maxVisible = 4,
}: AttendeeStackProps) {
  if (attendees.length === 0) return null;

  const visible = attendees.slice(0, maxVisible);
  const overflow = attendees.length - maxVisible;

  return (
    <Box className="flex-row items-center" accessibilityLabel={`${attendees.length} attendees`}>
      {visible.map((attendee, index) => {
        const ringColor = attendee.rsvp === 'going' ? RING_GOING : RING_PENDING;
        return (
          <DynamicColorView
            key={attendee.userId ?? `${attendee.initials}-${index}`}
            className={ringStyle({ overlap: index > 0 })}
            backgroundColor={ringColor}
            zIndex={visible.length - index}
          >
            <Box className={gapStyle({})}>
              <DynamicColorView className={avatarStyle({})} backgroundColor={attendee.color}>
                <Text className={initialsStyle({})}>{attendee.initials}</Text>
              </DynamicColorView>
            </Box>
          </DynamicColorView>
        );
      })}
      {overflow > 0 && (
        <Text className="ml-1 text-[10px] font-semibold text-typography-400">+{overflow}</Text>
      )}
    </Box>
  );
});
