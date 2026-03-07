import { memo } from 'react';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { formatSectionDate } from '@utils/formatTime';
import Svg, { Path } from 'react-native-svg';

const containerStyle = tva({ base: 'bg-background-0 px-4 py-2' });
const rowStyle = tva({ base: 'items-center justify-between' });
const labelStyle = tva({ base: 'text-sm font-semibold text-typography-500' });

type CardMode = 'full' | 'compact';

interface DateSectionHeaderProps {
  dateString: string;
  today: string;
  mode?: CardMode;
  onToggleMode?: () => void;
}

function ToggleIcon({ mode }: { mode: CardMode }) {
  // List icon for full mode (tap to switch to compact), grid icon for compact (tap to switch to full)
  if (mode === 'full') {
    // Hamburger/list icon
    return (
      <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
        <Path d="M2 4h12M2 8h12M2 12h12" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" />
      </Svg>
    );
  }
  // Grid/expand icon
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z"
        stroke="#9CA3AF"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const DateSectionHeader = memo(function DateSectionHeader({
  dateString,
  today,
  mode,
  onToggleMode,
}: DateSectionHeaderProps) {
  const label = formatSectionDate(dateString, today);

  return (
    <Box className={containerStyle({})}>
      <HStack className={rowStyle({})}>
        <Text className={labelStyle({})}>{label}</Text>
        {mode && onToggleMode && (
          <Pressable
            onPress={onToggleMode}
            accessibilityRole="button"
            accessibilityLabel={mode === 'full' ? 'Switch to compact view' : 'Switch to full view'}
            hitSlop={8}
          >
            <ToggleIcon mode={mode} />
          </Pressable>
        )}
      </HStack>
    </Box>
  );
});
