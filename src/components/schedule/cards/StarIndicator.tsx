import { memo } from 'react';
import Svg, { Path } from 'react-native-svg';

import { Box } from '@/components/ui/box';

/** Gold star color from mockup */
const STAR_COLOR = '#FBBF24';

/**
 * Read-only gold star overflowing the top-right corner of a card.
 * The parent card must NOT have overflow-hidden so the star can show.
 * Positioned via NativeWind negative-inset utilities (-top-1.5 = -6px, -right-1.5 = -6px).
 */
export const StarIndicator = memo(function StarIndicator() {
  return (
    <Box className="absolute -right-1.5 -top-1.5 z-10 h-5 w-5" accessibilityLabel="Starred">
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
          fill={STAR_COLOR}
          stroke={STAR_COLOR}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      </Svg>
    </Box>
  );
});
