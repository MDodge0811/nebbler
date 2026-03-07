import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Pressable } from '@/components/ui/pressable';

interface MeatballMenuButtonProps {
  onPress: () => void;
  color?: string;
  size?: number;
}

export const MeatballMenuButton = memo(function MeatballMenuButton({
  onPress,
  color = '#FFFFFF',
  size = 24,
}: MeatballMenuButtonProps) {
  const dotR = size * 0.08;
  const cx = size / 2;
  const spacing = size * 0.2;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="More options"
      style={styles.button}
      hitSlop={8}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={cx} cy={cx - spacing} r={dotR} fill={color} />
        <Circle cx={cx} cy={cx} r={dotR} fill={color} />
        <Circle cx={cx} cy={cx + spacing} r={dotR} fill={color} />
      </Svg>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
});
