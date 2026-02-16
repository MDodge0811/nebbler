import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { tva } from '@gluestack-ui/utils/nativewind-utils';

import { ScheduleScreen } from '@screens/ScheduleScreen';
import { HomeScreen } from '@screens/HomeScreen';
import { SettingsScreen } from '@screens/SettingsScreen';
import { DetailsScreen } from '@screens/DetailsScreen';
import { ProfileScreen } from '@screens/ProfileScreen';
import { DrawerContent } from '@components/schedule/DrawerContent';
import { AuthNavigator } from './AuthNavigator';
import { navigationTheme } from '@constants/theme';
import { useAuth } from '@hooks/useAuth';
import { Box } from '@/components/ui/box';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import type { RootStackParamList, MainTabParamList, DrawerParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

const loadingContainerStyle = tva({ base: 'flex-1 items-center justify-center bg-background-0' });
const loadingTextStyle = tva({ base: 'mt-4 text-base text-typography-600' });

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function MainDrawer() {
  return (
    <Drawer.Navigator
      id="MainDrawer"
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        drawerPosition: 'right',
        drawerType: 'slide',
        headerShown: false,
        drawerStyle: { width: 280 },
      }}
    >
      <Drawer.Screen name="Tabs" component={MainTabs} />
    </Drawer.Navigator>
  );
}

function MainNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Main" component={MainDrawer} options={{ headerShown: false }} />
      <Stack.Screen name="Details" component={DetailsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box className={loadingContainerStyle({})}>
        <Spinner size="large" />
        <Text className={loadingTextStyle({})}>Loading...</Text>
      </Box>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
