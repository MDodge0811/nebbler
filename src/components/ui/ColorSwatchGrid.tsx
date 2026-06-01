import { View, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { CALENDAR_PALETTE, calendarsUIColors } from '@constants/calendarsUI';

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
    <View style={styles.container}>
      {CALENDAR_PALETTE.map((color) => {
        const isSelected = color.hex.toUpperCase() === value.toUpperCase();
        return (
          <Pressable
            key={color.hex}
            testID={isSelected ? `color-swatch-${color.hex}-selected` : `color-swatch-${color.hex}`}
            onPress={() => onChange(color.hex)}
            accessibilityRole="button"
            accessibilityLabel={`Color ${color.name}`}
            style={[
              styles.swatch,
              { backgroundColor: color.hex },
              isSelected && styles.swatchSelected,
            ]}
          >
            {isSelected ? <CheckIcon /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    paddingHorizontal: 10,
    backgroundColor: calendarsUIColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
