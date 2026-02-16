import Svg, { Circle } from 'react-native-svg';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Pressable } from '@/components/ui/pressable';

function MeatballIcon({ size = 24, color = '#666666' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
    </Svg>
  );
}

export function OverflowMenu() {
  const navigation = useNavigation();
  const drawerNavigation = navigation.getParent('MainDrawer');

  return (
    <Pressable
      onPress={() => drawerNavigation?.dispatch(DrawerActions.toggleDrawer())}
      accessibilityRole="button"
      accessibilityLabel="More options"
    >
      <MeatballIcon />
    </Pressable>
  );
}
