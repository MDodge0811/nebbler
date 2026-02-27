import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';

const TAB_COLORS = {
  active: '#00DB74',
  inactive: '#999999',
  background: '#FFFFFF',
  border: '#E5E5E5',
} as const;

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
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4v16M4 12h16" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function PeopleIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={9} cy={7} r={3} stroke={color} strokeWidth={2} />
      <Path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke={color} strokeWidth={2} />
      <Circle cx={17} cy={8} r={2.5} stroke={color} strokeWidth={2} />
      <Path d="M21 21v-1.5a3 3 0 00-3-3h-.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

const TAB_ICONS: Record<string, (props: { color: string }) => ReactNode> = {
  Calendars: CalendarIcon,
  Home: HomeIcon,
  People: PeopleIcon,
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
        const isCreateTab = route.name === 'Create';

        if (isCreateTab) {
          return (
            <Pressable
              key={route.key}
              style={styles.tab}
              onPress={() => rootNavigation.navigate('CreateEvent')}
              accessibilityRole="button"
              accessibilityLabel="Create event"
            >
              <View style={styles.createButton}>
                <PlusIcon />
              </View>
              <Text style={[styles.label, { color: TAB_COLORS.inactive }]}>New</Text>
            </Pressable>
          );
        }

        const color = isFocused ? TAB_COLORS.active : TAB_COLORS.inactive;
        const Icon = TAB_ICONS[route.name];

        return (
          <Pressable
            key={route.key}
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
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: TAB_COLORS.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TAB_COLORS.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TAB_COLORS.active,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
