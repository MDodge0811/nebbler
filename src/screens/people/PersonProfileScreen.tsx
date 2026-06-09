import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, ScrollView } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { AvatarCircle } from '@components/ui/AvatarCircle';
import {
  useUserProfile,
  useConnectionWith,
  useSharedCalendars,
  useSharedCalendarCount,
} from '@hooks/useConnections';
import { useCurrentUser } from '@hooks/useCurrentUser';
import type { PeopleStackParamList, RootStackParamList } from '@navigation/types';
import { displayName } from '@utils/displayName';

type ScreenRoute = RouteProp<PeopleStackParamList, 'PersonProfile'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const sectionLabelStyle =
  'px-4 pb-1.5 pt-2 text-[13px] font-semibold tracking-[0.3px] text-brand-text-muted';
const sectionCardStyle =
  'mx-3 mb-3 overflow-hidden rounded-[14px] border border-brand-border bg-background-0';
const dangerRowStyle = 'flex-row items-center gap-3 px-4 py-3.5 opacity-50';
const pillStyle = tva({
  base: 'mt-2 flex-row items-center gap-1.5 rounded-[20px] border px-[14px] py-[5px]',
  variants: {
    connected: {
      true: 'border-brand-primary-border bg-brand-primary-light',
    },
  },
});
const pillDotStyle = tva({
  base: 'h-[7px] w-[7px] rounded-full',
  variants: { connected: { true: 'bg-brand-primary' } },
});
const pillTextStyle = tva({
  base: 'text-[13px] font-semibold',
  variants: { connected: { true: 'text-brand-primary' } },
});

function ClockIcon({ color = '#fff' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Circle cx="9" cy="9" r="7" stroke={color} strokeWidth="1.5" />
      <Path
        d="M9 5V9L12 11"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PersonProfileScreen() {
  const route = useRoute<ScreenRoute>();
  const navigation = useNavigation<Nav>();
  const { user: me } = useCurrentUser();
  const currentUserId = me?.id;
  const userId = route.params.userId;
  const toast = useToast();

  const user = useUserProfile(userId);
  const connection = useConnectionWith(currentUserId, userId);
  const sharedCalendars = useSharedCalendars(currentUserId, userId);
  const sharedCount = useSharedCalendarCount(currentUserId, userId);

  if (user === null) {
    return (
      <Box className="flex-1 items-center justify-center p-6">
        <Text className="text-base text-brand-text-secondary">This person isn't available.</Text>
      </Box>
    );
  }

  const name = displayName({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: null,
  });

  const isConnected = connection !== null;

  const handleFindTime = () => {
    toast.show({
      id: 'find-a-time-coming-soon',
      placement: 'top',
      title: 'Find a Time is coming soon.',
    });
  };

  const handleRemove = () => {
    Alert.alert(
      'Coming Soon',
      'Removing connections will be available shortly — this feature requires online access.'
    );
  };

  const handleBlock = () => {
    Alert.alert(
      'Coming Soon',
      'Blocking will be available shortly — this feature requires online access.'
    );
  };

  return (
    <ScrollView className="flex-1 bg-brand-surface-subtle" contentContainerClassName="py-3">
      <Box className="m-3 items-center gap-2 rounded-2xl border border-brand-border bg-background-0 p-6">
        <AvatarCircle user={user} size={80} />
        <Text className="text-[22px] font-bold text-brand-text">{name}</Text>

        <StatusPill connected={isConnected} />

        <Box className="mt-4 flex-row gap-5 border-t border-brand-divider pt-3">
          <Box className="min-w-[60px] items-center">
            <Text className="text-base font-bold text-brand-text">{sharedCount}</Text>
            <Text className="mt-0.5 text-xs text-brand-text-muted">Shared</Text>
          </Box>
        </Box>
      </Box>

      <Pressable
        className="m-3 flex-row items-center justify-center gap-2.5 rounded-[14px] bg-brand-primary py-3.5 opacity-50"
        onPress={handleFindTime}
      >
        <ClockIcon />
        <Text className="text-base font-bold text-typography-white">Find a Time</Text>
      </Pressable>

      <Text className={sectionLabelStyle}>SHARED CALENDARS</Text>
      <Box className={sectionCardStyle}>
        {sharedCalendars.length > 0 ? (
          sharedCalendars.map((cal) => (
            <Pressable
              key={cal.id}
              className="flex-row items-center gap-3 px-4 py-3"
              onPress={() => navigation.navigate('CalendarDetail', { calendarId: cal.id })}
            >
              <DynamicColorView
                className="h-9 w-9 rounded-[10px] border-[1.5px]"
                backgroundColor={`${cal.color ?? '#9B9BA8'}15`}
                borderColor={`${cal.color ?? '#9B9BA8'}30`}
              />
              <Text className="flex-1 text-[15px] font-medium text-brand-text">{cal.name}</Text>
              <Text className="text-base text-brand-text-muted">›</Text>
            </Pressable>
          ))
        ) : (
          <Text className="p-5 text-center text-sm text-brand-text-muted">
            You don't share any calendars with {name} yet.
          </Text>
        )}
      </Box>

      <Text className={sectionLabelStyle}>CONNECTION</Text>
      <Box className={sectionCardStyle}>
        <Pressable className={dangerRowStyle} onPress={handleRemove}>
          <Box className="w-4 items-center">
            <Text className="text-base text-brand-danger">⊖</Text>
          </Box>
          <Box className="flex-1">
            <Text className="text-[15px] font-medium text-brand-danger">Remove Connection</Text>
            <Text className="mt-0.5 text-xs text-brand-text-muted">Coming soon</Text>
          </Box>
        </Pressable>
        <Box className="ml-11 h-px bg-brand-divider" />
        <Pressable className={dangerRowStyle} onPress={handleBlock}>
          <Box className="w-4 items-center">
            <Text className="text-base text-brand-danger">⊘</Text>
          </Box>
          <Box className="flex-1">
            <Text className="text-[15px] font-medium text-brand-danger">Block</Text>
            <Text className="mt-0.5 text-xs text-brand-text-muted">Coming soon</Text>
          </Box>
        </Pressable>
      </Box>
    </ScrollView>
  );
}

function StatusPill({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <Box className={pillStyle({ connected: true })}>
        <Box className={pillDotStyle({ connected: true })} />
        <Text className={pillTextStyle({ connected: true })}>Connected</Text>
      </Box>
    );
  }
  return <Text className="mt-2 text-[13px] text-brand-text-muted">Not connected</Text>;
}
