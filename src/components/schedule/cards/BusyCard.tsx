import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { memo } from 'react';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

const cardStyle = tva({
  base: 'mx-4 mb-3 overflow-hidden rounded-xl border border-dashed border-outline-300',
});
const bodyStyle = tva({ base: 'items-center justify-center px-4 py-5' });
const busyLabelStyle = tva({ base: 'text-[15px] font-medium italic text-typography-400' });
const timeStyle = tva({ base: 'mt-0.5 text-[12px] text-typography-300' });

/**
 * Diagonal-hatch SVG pattern for the BusyCard background.
 * Built entirely with react-native-svg — no image assets.
 */
function HatchBackground() {
  return (
    <Box className="absolute inset-0">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="busyHatch" patternUnits="userSpaceOnUse" width={12} height={12}>
            <Rect width={12} height={12} fill="#F7F7FA" />
            <Line x1={0} y1={12} x2={12} y2={0} stroke="#EAEAEF" strokeWidth={1.5} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#busyHatch)" />
      </Svg>
    </Box>
  );
}

interface BusyCardProps {
  timeRange?: string;
}

/**
 * De-emphasized busy-block card.
 * Dashed border, diagonal-hatch background, italic muted "Busy" label.
 * No tint, star, or meta.
 */
export const BusyCard = memo(function BusyCard({ timeRange }: BusyCardProps) {
  return (
    <Box className={cardStyle({})}>
      <HatchBackground />
      <VStack className={bodyStyle({})}>
        <Text className={busyLabelStyle({})}>Busy</Text>
        {timeRange ? <Text className={timeStyle({})}>{timeRange}</Text> : null}
      </VStack>
    </Box>
  );
});
