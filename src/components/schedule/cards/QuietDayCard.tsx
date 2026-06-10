import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { memo } from 'react';
import Svg, { Path } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

const cardStyle = tva({
  base: 'mx-4 mb-3 rounded-xl border border-dashed border-outline-200 bg-background-0',
});
const bodyStyle = tva({ base: 'flex-row items-center gap-3 px-4 py-3.5' });
const iconTileStyle = tva({
  base: 'h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-brand-primary-light',
});
const titleStyle = tva({ base: 'text-[14px] font-semibold text-typography-900' });
const subtitleStyle = tva({ base: 'mt-0.5 text-[12px] text-typography-400' });

/** Leaf icon — react-native-svg, no image assets */
function LeafIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 22c0 0 4-2 8-8s6-12 12-12c0 6-4 10-8 12S6 18 2 22z"
        fill="#00DB74"
        stroke="#00DB74"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M14 10L2 22" stroke="#00DB74" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Quiet / open-day card: leaf icon tile, "Open day" heading, breathing-room copy.
 */
export const QuietDayCard = memo(function QuietDayCard() {
  return (
    <Box className={cardStyle({})}>
      <HStack className={bodyStyle({})}>
        <Box className={iconTileStyle({})}>
          <LeafIcon />
        </Box>
        <VStack className="flex-1">
          <Text className={titleStyle({})}>Open day</Text>
          <Text className={subtitleStyle({})} numberOfLines={2}>
            Breathing room. Tap + to add something.
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
});
