import { tva } from '@gluestack-ui/utils/nativewind-utils';
import Svg, { Path } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { Pressable } from '@/components/ui/pressable';
import { CALENDAR_PALETTE } from '@constants/calendarsUI';

const containerStyle = tva({
  base: 'flex-row flex-wrap gap-2 rounded-[14px] border-[1px] border-brand-border bg-background-0 p-3 px-2.5',
});
const swatchStyle = tva({
  base: 'h-9 w-9 items-center justify-center rounded-[10px]',
  variants: {
    selected: { true: 'border-[2.5px] border-background-0 shadow-sm', false: '' },
  },
});

interface ColorSwatchGridProps {
  value: string;
  onChange: (hex: string) => void;
}

function CheckIcon({ size = 14, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path
        d="M2 7L6 11L12 3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ColorSwatchGrid({ value, onChange }: ColorSwatchGridProps) {
  return (
    <Box className={containerStyle({})}>
      {CALENDAR_PALETTE.map((color) => {
        const isSelected = color.hex.toUpperCase() === value.toUpperCase();
        return (
          <Pressable
            key={color.hex}
            testID={isSelected ? `color-swatch-${color.hex}-selected` : `color-swatch-${color.hex}`}
            onPress={() => onChange(color.hex)}
            accessibilityRole="button"
            accessibilityLabel={`Color ${color.name}`}
          >
            <DynamicColorView
              className={swatchStyle({ selected: isSelected })}
              backgroundColor={color.hex}
            >
              {isSelected ? <CheckIcon /> : null}
            </DynamicColorView>
          </Pressable>
        );
      })}
    </Box>
  );
}
