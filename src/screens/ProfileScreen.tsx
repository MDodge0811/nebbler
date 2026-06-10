import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Alert, LayoutAnimation, Platform, ScrollView, UIManager } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { AvatarCircle } from '@components/ui/AvatarCircle';
import { ColorSwatchGrid } from '@components/ui/ColorSwatchGrid';
import { useAuth } from '@hooks/useAuth';
import { useConnections, useUserProfile } from '@hooks/useConnections';
import { useConnectionRequests } from '@hooks/useConnectionsApi';
import { useCurrentUser, useCurrentUserMutations } from '@hooks/useCurrentUser';
import type { RootStackParamList } from '@navigation/types';
import { displayName } from '@utils/displayName';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Nav = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

type Profile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_color: string | null;
};

const cardClass = 'mx-3 overflow-hidden rounded-[14px] border border-brand-border bg-background-0';

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user: me } = useCurrentUser();
  const { signOut, user: authUser } = useAuth();
  const { updateAvatarColor } = useCurrentUserMutations();
  const profile = useUserProfile(me?.id);
  const { connections } = useConnections(me?.id);
  const { data: requests, refetch } = useConnectionRequests();
  const pendingCount = requests?.incoming.length ?? 0;

  const [expanded, setExpanded] = useState(false);

  // Poll-on-open: refresh the pending-request badge whenever the screen focuses.
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const handleColorChange = (hex: string) => {
    if (me?.id) void updateAvatarColor(me.id, hex);
  };

  const handleLogOut = () => {
    Alert.alert('Log out?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  const goToConnections = () => {
    navigation.navigate('Main', {
      screen: 'Tabs',
      params: { screen: 'People', params: { screen: 'Connections' } },
    });
  };

  if (!profile || !me) {
    return (
      <Box className="flex-1 items-center justify-center bg-brand-surface-subtle">
        <Text className="text-base text-brand-text-muted">Loading…</Text>
      </Box>
    );
  }

  const name = displayName({
    id: profile.id,
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: authUser?.email ?? null,
  });

  return (
    <ScrollView className="flex-1 bg-brand-surface-subtle" contentContainerClassName="gap-3 py-3">
      <ProfileCard
        profile={profile}
        name={name}
        expanded={expanded}
        onToggle={toggleExpanded}
        onColorChange={handleColorChange}
      />

      <ConnectionsRow
        connectedCount={connections.length}
        pendingCount={pendingCount}
        onPress={goToConnections}
      />

      <Pressable className={cardClass} onPress={handleLogOut} accessibilityRole="button">
        <Text className="p-4 text-center text-[15px] font-semibold text-brand-danger">Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function ProfileCard({
  profile,
  name,
  expanded,
  onToggle,
  onColorChange,
}: {
  profile: Profile;
  name: string;
  expanded: boolean;
  onToggle: () => void;
  onColorChange: (hex: string) => void;
}) {
  return (
    <Box className={cardClass}>
      <Box className="items-center px-5 pb-6 pt-7">
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel="Change avatar color"
        >
          <AvatarCircle user={profile} size={80} />
        </Pressable>
        <Text className="mt-4 text-[22px] font-bold tracking-[-0.3px] text-brand-text">{name}</Text>
        {profile.username && (
          <Text className="mt-1 text-sm text-brand-text-muted">@{profile.username}</Text>
        )}
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          className="mt-3 rounded-[20px] border border-brand-border bg-brand-surface-muted px-[14px] py-[5px]"
        >
          <Text className="text-[13px] font-semibold text-brand-text-secondary">
            {expanded ? 'Done' : 'Edit color'}
          </Text>
        </Pressable>
      </Box>
      {expanded && (
        <>
          <Box className="mx-4 h-px bg-brand-divider" />
          <ColorSwatchGrid value={profile.avatar_color ?? '#00DB74'} onChange={onColorChange} />
        </>
      )}
    </Box>
  );
}

function ConnectionsRow({
  connectedCount,
  pendingCount,
  onPress,
}: {
  connectedCount: number;
  pendingCount: number;
  onPress: () => void;
}) {
  return (
    <Pressable className={cardClass} onPress={onPress} accessibilityRole="button">
      <Box className="flex-row items-center gap-3 px-4 py-3.5">
        <PeopleIcon />
        <Box className="flex-1">
          <Text className="text-[15px] font-medium text-brand-text">Connections</Text>
          <Text className="mt-0.5 text-[13px] text-brand-text-muted">
            {connectedCount} connected
            {pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
          </Text>
        </Box>
        {pendingCount > 0 && (
          <Box
            testID="pending-badge"
            className="min-w-[18px] items-center rounded-[10px] bg-brand-primary px-[7px] py-px"
          >
            <Text className="text-[11px] font-bold text-typography-white">{pendingCount}</Text>
          </Box>
        )}
        <Text className="text-lg text-brand-text-muted">›</Text>
      </Box>
    </Pressable>
  );
}

function PeopleIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx="8" cy="7" r="3" stroke="#9B9BA8" strokeWidth="1.6" />
      <Path
        d="M2 18C2 14.7 4.7 13 8 13C11.3 13 14 14.7 14 18"
        stroke="#9B9BA8"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <Circle cx="16" cy="8" r="2.5" stroke="#9B9BA8" strokeWidth="1.4" />
      <Path
        d="M14 18C14 15.5 15.5 14 17.5 14C19.5 14 20 15 20 16.5"
        stroke="#9B9BA8"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </Svg>
  );
}
