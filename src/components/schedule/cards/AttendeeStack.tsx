import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { memo } from 'react';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { Text } from '@/components/ui/text';
import type { AttendeeChip } from '@components/schedule/cards/types';

/** RSVP ring colors from mockup */
const RING_GOING = '#00DB74';
const RING_PENDING = '#C7C7CF';

const avatarStyle = tva({
  base: 'items-center justify-center overflow-hidden rounded-full',
});

const initialsStyle = tva({
  base: 'font-bold text-typography-white text-[7px]',
});

interface AttendeeStackProps {
  attendees: AttendeeChip[];
  maxVisible?: number;
  size?: number;
}

/**
 * Overlapping avatar stack with per-attendee RSVP rings.
 * Ring = white gap (1.5px) + outer ring (3px) implemented via borderWidth layers.
 *
 * Because box-shadow is not cross-platform in RN, we use two concentric circles:
 * an outer DynamicColorView (ring color) wrapping an inner white spacer wrapping
 * the avatar. This is the sanctioned DynamicColorView escape hatch.
 */
export const AttendeeStack = memo(function AttendeeStack({
  attendees,
  maxVisible = 4,
  size = 18,
}: AttendeeStackProps) {
  if (attendees.length === 0) return null;

  const visible = attendees.slice(0, maxVisible);
  const overflow = attendees.length - maxVisible;
  // Each avatar gets outer ring (3px) + white gap (1.5px → round to 2px) → total pad = 5px
  const outerSize = size + 10; // 5px each side
  const innerSize = size + 4; // 2px each side (white gap)

  return (
    <Box className="flex-row items-center" accessibilityLabel={`${attendees.length} attendees`}>
      {visible.map((attendee, index) => {
        const ringColor = attendee.rsvp === 'going' ? RING_GOING : RING_PENDING;
        const marginLeft = index === 0 ? 0 : -5;
        return (
          <DynamicColorView
            key={`${attendee.initials}-${index}`}
            className="items-center justify-center rounded-full"
            backgroundColor={ringColor}
            style={{ width: outerSize, height: outerSize, borderRadius: outerSize / 2, marginLeft }}
            zIndex={visible.length - index}
          >
            {/* White gap */}
            <Box
              className="items-center justify-center overflow-hidden rounded-full bg-background-0"
              style={{ width: innerSize, height: innerSize, borderRadius: innerSize / 2 }}
            >
              {/* Avatar */}
              <DynamicColorView
                className={avatarStyle({})}
                backgroundColor={attendee.color}
                style={{ width: size, height: size, borderRadius: size / 2 }}
              >
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
