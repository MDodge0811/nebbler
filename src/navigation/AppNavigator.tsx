import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeScreen } from '@screens/HomeScreen';
import { SettingsScreen } from '@screens/SettingsScreen';
import { DetailsScreen } from '@screens/DetailsScreen';
import { SignInScreen } from '@screens/SignInScreen';
import { useAuth } from '@hooks/useAuth';
import type { RootStackParamList, MainTabParamList, AuthStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <RootStack.Navigator>
          <RootStack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <RootStack.Screen name="Details" component={DetailsScreen} />
        </RootStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="SignIn" component={SignInScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
