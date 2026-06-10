import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';

const rowStyle = tva({ base: 'mx-4 my-1 items-center gap-2' });
const labelStyle = tva({
  base: 'text-[10px] font-bold uppercase tracking-widest text-brand-primary',
});
const lineWrapStyle = tva({ base: 'h-[1.5px] flex-1 overflow-hidden' });
const dotStyle = tva({ base: 'h-2 w-2 rounded-full bg-brand-primary' });

const lineFill = StyleSheet.absoluteFill;

interface NowLineRowProps {
  /** Label string e.g. "NOW · 9:32". No internal timer — caller supplies the text. */
  label: string;
}

/**
 * Horizontal "now" indicator row.
 * Label (primary green, uppercase) + gradient line fading right + dot at far right.
 * No timers inside — time string is supplied by caller (FlashList recycling safe).
 */
export const NowLineRow = memo(function NowLineRow({ label }: NowLineRowProps) {
  return (
    <HStack className={rowStyle({})} accessibilityLabel={label} accessibilityRole="none">
      <Text className={labelStyle({})}>{label}</Text>
      <Box className={lineWrapStyle({})}>
        {/* Brand primary (#00DB74) fading to transparent */}
        <LinearGradient
          colors={['#00DB74', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={lineFill}
        />
      </Box>
      <Box className={dotStyle({})} />
    </HStack>
  );
});
