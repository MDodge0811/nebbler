import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Pressable } from '@/components/ui/pressable';

interface CalendarCheckboxProps {
  checked: boolean;
  color: string;
  onToggle: () => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function CalendarCheckbox({ checked, color, onToggle }: CalendarCheckboxProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(checked ? color : 'transparent', { duration: 150 }),
    borderColor: withTiming(checked ? color : '#E8E8EC', { duration: 150 }),
    transform: [{ scale: withTiming(checked ? 1 : 1, { duration: 100 }) }],
  }));

  return (
    <Pressable onPress={onToggle} hitSlop={8}>
      <AnimatedView style={[styles.checkbox, animatedStyle]}>
        {checked && (
          <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <Path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="white"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
      </AnimatedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
