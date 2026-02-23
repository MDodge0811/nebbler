import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';

function CalendarIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={18} rx={2} stroke={color} strokeWidth={2} />
      <Line x1={3} y1={10} x2={21} y2={10} stroke={color} strokeWidth={2} />
      <Line x1={8} y1={2} x2={8} y2={6} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={16} y1={2} x2={16} y2={6} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12L12 3l9 9" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function GearIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2} />
      <Path
        d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PlusIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Path d="M14 4v20M4 14h20" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

const TAB_ICONS: Record<string, (props: { color: string }) => ReactNode> = {
  Schedule: CalendarIcon,
  Home: HomeIcon,
  Settings: GearIcon,
};

export function CustomTabBar({ state, descriptors, navigation: tabNavigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const rootNavigation = useNavigation();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const color = isFocused ? '#00DB74' : '#999999';
        const Icon = TAB_ICONS[route.name];

        // Insert the FAB before the middle tab
        const middleIndex = Math.floor(state.routes.length / 2);

        return (
          <View key={route.key} style={styles.tabWrapper}>
            {index === middleIndex && (
              <View style={styles.fabContainer}>
                <Pressable
                  style={styles.fab}
                  onPress={() => rootNavigation.navigate('CreateEvent')}
                  accessibilityRole="button"
                  accessibilityLabel="Create event"
                >
                  <PlusIcon />
                </Pressable>
              </View>
            )}
            <Pressable
              onPress={() => {
                const event = tabNavigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  tabNavigation.navigate(route.name);
                }
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? route.name}
              style={styles.tab}
            >
              {Icon && <Icon color={color} />}
              <Text style={[styles.label, { color }]}>{route.name}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  tabWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
  },
  fabContainer: {
    position: 'absolute',
    top: -28,
    alignSelf: 'center',
    zIndex: 1,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00DB74',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
