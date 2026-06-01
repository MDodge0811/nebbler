import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { PeopleStackParamList } from '@navigation/types';
import { ConnectionsScreen, AddConnectionScreen, PersonProfileScreen } from '@screens/people';

const PeopleStack = createNativeStackNavigator<PeopleStackParamList>();

function PlusIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M11 4V18M4 11H18" stroke="#1A1A1F" strokeWidth={2} strokeLinecap="round" />
    </Svg>
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
            <Pressable
              onPress={() => navigation.navigate('AddConnection')}
              accessibilityRole="button"
              accessibilityLabel="Add connection"
              hitSlop={12}
              style={styles.headerButton}
            >
              <PlusIcon />
            </Pressable>
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
