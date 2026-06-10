import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  VerifyCode: { email: string; mode: 'sign-in' | 'sign-up' };
};

export type DrawerParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList>;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<DrawerParamList>;
  Profile: undefined;
  CreateEvent:
    | {
        mode?: 'create' | 'edit';
        eventId?: string;
        preselectedCalendarId?: string;
        preselectedPeople?: string[];
        socialContext?: { calendarId: string };
      }
    | undefined;
  CreateCalendar: undefined;
  EventDetail: { eventId: string };
  CalendarDetail: { calendarId: string };
};

export type PeopleStackParamList = {
  Connections: undefined;
  AddConnection: undefined;
  PersonProfile: { userId: string };
};

export type MainTabParamList = {
  Calendars: undefined;
  Home: undefined;
  Create: undefined;
  People: NavigatorScreenParams<PeopleStackParamList>;
  Settings: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type DrawerScreenPropsType<T extends keyof DrawerParamList> = CompositeScreenProps<
  DrawerScreenProps<DrawerParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  DrawerScreenPropsType<keyof DrawerParamList>
>;

export type PeopleStackScreenProps<T extends keyof PeopleStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<PeopleStackParamList, T>,
  MainTabScreenProps<keyof MainTabParamList>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
