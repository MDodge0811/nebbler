import { useEffect } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  type BottomTabNavigationProp,
} from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { tva } from '@gluestack-ui/utils/nativewind-utils';

import { ScheduleScreen } from '@screens/ScheduleScreen';
import { CalendarsScreen } from '@screens/CalendarsScreen';
import { PeopleScreen } from '@screens/PeopleScreen';
import { SettingsScreen } from '@screens/SettingsScreen';
import { ProfileScreen } from '@screens/ProfileScreen';
import { CreateEventScreen } from '@screens/CreateEventScreen';
import { EventDetailScreen } from '@screens/EventDetailScreen';
import { CalendarDetailScreen } from '@screens/CalendarDetailScreen';
import { CreateCalendarScreen } from '@screens/CreateCalendarScreen';
import { DrawerContent } from '@components/schedule/DrawerContent';
import { CustomTabBar } from '@components/schedule/CustomTabBar';
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

// Fallback for the Create tab — CustomTabBar handles navigation, but if a user
// lands here via deep link or state restoration, redirect to Home.
function CreateFallback() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  useEffect(() => {
    navigation.navigate('Home');
  }, [navigation]);
  return null;
}

function MainTabs() {
  return (
    <Tab.Navigator initialRouteName="Home" tabBar={(props) => <CustomTabBar {...props} />}>
      <Tab.Screen name="Calendars" component={CalendarsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Home" component={ScheduleScreen} options={{ headerShown: false }} />
      <Tab.Screen
        name="Create"
        component={CreateFallback}
        options={{ headerShown: false }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
          },
        }}
      />
      <Tab.Screen name="People" component={PeopleScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
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
    <BottomSheetModalProvider>
      <Stack.Navigator>
        <Stack.Screen name="Main" component={MainDrawer} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
        <Stack.Screen name="EventDetail" component={EventDetailScreen} />
        <Stack.Screen name="CalendarDetail" component={CalendarDetailScreen} />
        <Stack.Screen name="CreateCalendar" component={CreateCalendarScreen} />
      </Stack.Navigator>
    </BottomSheetModalProvider>
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
