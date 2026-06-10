import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { PeopleStackParamList } from '@navigation/types';
import { ConnectionsScreen, AddConnectionScreen, PersonProfileScreen } from '@screens/people';

const PeopleStack = createNativeStackNavigator<PeopleStackParamList>();

export function PeopleTabNavigator() {
  return (
    <PeopleStack.Navigator>
      <PeopleStack.Screen
        name="Connections"
        component={ConnectionsScreen}
        options={{ headerShown: false }}
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
