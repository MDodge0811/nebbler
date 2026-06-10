import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { useScheduleStore } from '@stores/useScheduleStore';

/** Gold star fill color — matches StarIndicator */
const STAR_GOLD = '#FBBF24';

const headerContainerStyle = tva({ base: 'bg-background-0' });
const headerRowStyle = tva({ base: 'h-14 items-center justify-between px-4' });
const leftZoneStyle = tva({ base: 'flex-row flex-1 items-center gap-2' });
const monthTextStyle = tva({ base: 'text-3xl font-bold text-typography-900' });
const yearTextStyle = tva({ base: 'text-3xl text-typography-400' });
const rightZoneStyle = tva({ base: 'flex-row items-center gap-2' });
const iconBtnStyle = tva({
  base: 'h-[34px] w-[34px] items-center justify-center rounded-full border border-outline-200 bg-background-0',
  variants: {
    active: {
      true: 'bg-brand-star-active-bg border-brand-star-active-border',
    },
  },
});

function StarFilterIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24">
        <Path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
          fill={STAR_GOLD}
          stroke={STAR_GOLD}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
        fill="none"
        stroke="#888888"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
        fill="none"
        stroke="#888888"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ScheduleHeader() {
  const insets = useSafeAreaInsets();
  const displayMonth = useScheduleStore((s) => s.displayMonth);
  const starredOnly = useScheduleStore((s) => s.starredOnly);
  const toggleStarredOnly = useScheduleStore((s) => s.toggleStarredOnly);

  const date = new Date(displayMonth + 'T12:00:00');
  const monthName = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear().toString();

  return (
    <Box className={headerContainerStyle({})} style={{ paddingTop: insets.top }}>
      <HStack className={headerRowStyle({})}>
        <Box className={leftZoneStyle({})}>
          <Text className={monthTextStyle({})}>{monthName}</Text>
          <Text className={yearTextStyle({})}>{year}</Text>
        </Box>

        <HStack className={rightZoneStyle({})}>
          {/* Star filter: outline when inactive, gold-filled + warm bg when active */}
          <Pressable
            className={iconBtnStyle({ active: starredOnly })}
            onPress={toggleStarredOnly}
            accessibilityRole="button"
            accessibilityLabel={starredOnly ? 'Star filter active' : 'Star filter'}
            accessibilityState={{ selected: starredOnly }}
          >
            <StarFilterIcon active={starredOnly} />
          </Pressable>

          {/* Search: visual placeholder — full search is a future project */}
          {/* placeholder: search feature — ref schedule-tab-redesign-design.md */}
          <Pressable
            className={iconBtnStyle({ active: false })}
            onPress={() => {
              // placeholder: search not implemented this pass
            }}
            accessibilityRole="button"
            accessibilityLabel="Search"
          >
            <SearchIcon />
          </Pressable>
        </HStack>
      </HStack>
    </Box>
  );
}
