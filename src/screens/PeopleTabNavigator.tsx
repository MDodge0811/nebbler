import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { calendarsUIColors } from '@constants/calendarsUI';
import type { PeopleStackParamList } from '@navigation/types';
import { AddConnectionScreen, ConnectionsScreen, PersonProfileScreen } from '@screens/people';

const PeopleStack = createNativeStackNavigator<PeopleStackParamList>();

function PlusIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path
        d="M11 4V18M4 11H18"
        stroke={calendarsUIColors.text}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Header "+" button for the Connections root. Exported so the navigator's
 * wiring is unit-testable without booting a NavigationContainer — see
 * `__tests__/PeopleTabNavigator.test.tsx`.
 */
export function AddConnectionHeaderButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add connection"
      hitSlop={12}
      style={styles.headerButton}
    >
      <PlusIcon />
    </Pressable>
  );
}

export function PeopleTabNavigator() {
  return (
    <PeopleStack.Navigator>
      <PeopleStack.Screen
        name="Connections"
        component={ConnectionsScreen}
        options={({ navigation }) => ({
          title: 'Connections',
          headerRight: () => (
            <AddConnectionHeaderButton onPress={() => navigation.navigate('AddConnection')} />
          ),
        })}
      />
      <PeopleStack.Screen
        name="AddConnection"
        component={AddConnectionScreen}
        options={{ title: 'Add People' }}
      />
      <PeopleStack.Screen
        name="PersonProfile"
        component={PersonProfileScreen}
        options={{ title: '' }}
      />
    </PeopleStack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerButton: { padding: 4 },
});
