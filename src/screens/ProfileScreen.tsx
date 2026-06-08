import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, LayoutAnimation, Platform, ScrollView, UIManager } from 'react-native';

import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { AvatarCircle } from '@components/ui/AvatarCircle';
import { ColorSwatchGrid } from '@components/ui/ColorSwatchGrid';
import { useAuth } from '@hooks/useAuth';
import { useConnections, useUserProfile } from '@hooks/useConnections';
import { useCurrentUser, useCurrentUserMutations } from '@hooks/useCurrentUser';
import type { RootStackParamList } from '@navigation/types';
import { displayName } from '@utils/displayName';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Nav = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

type AvatarCardProps = {
  profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_color: string | null;
  };
  name: string;
  email: string | null | undefined;
  expanded: boolean;
  onToggle: () => void;
  onColorChange: (hex: string) => Promise<void>;
};

const cardClass = 'mx-3 rounded-[14px] border border-brand-border bg-background-0';
const chevronClass = 'text-lg text-brand-text-muted';

function AvatarCard({ profile, name, email, expanded, onToggle, onColorChange }: AvatarCardProps) {
  return (
    <Box className={cardClass}>
      <Pressable className="flex-row items-center gap-3 p-4" onPress={onToggle}>
        <AvatarCircle user={profile} size={56} />
        <Box className="flex-1">
          <Text className="text-base font-semibold text-brand-text">{name}</Text>
          {email ? <Text className="mt-0.5 text-[13px] text-brand-text-muted">{email}</Text> : null}
        </Box>
        <Text className={chevronClass}>{expanded ? '▾' : '▸'}</Text>
      </Pressable>
      {expanded && (
        <>
          <Box className="mx-4 h-px bg-brand-divider" />
          <ColorSwatchGrid
            value={profile.avatar_color ?? '#00DB74'}
            onChange={(hex) => {
              void onColorChange(hex);
            }}
          />
        </>
      )}
    </Box>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user: me } = useCurrentUser();
  const { signOut, user: authUser } = useAuth();
  const { updateAvatarColor } = useCurrentUserMutations();
  const profile = useUserProfile(me?.id);
  const { pendingIncoming, accepted } = useConnections(me?.id);

  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const handleColorChange = async (hex: string) => {
    if (!me?.id) return;
    await updateAvatarColor(me.id, hex);
  };

  const handleLogOut = () => {
    Alert.alert('Log out?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  const handleConnectionsRowTap = () => {
    navigation.navigate('Main', {
      screen: 'Tabs',
      params: { screen: 'People', params: { screen: 'Connections' } },
    });
  };

  if (!profile || !me) {
    return (
      <Box className="flex-1 items-center justify-center">
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
      <AvatarCard
        profile={profile}
        name={name}
        email={authUser?.email}
        expanded={expanded}
        onToggle={toggleExpanded}
        onColorChange={handleColorChange}
      />

      <Pressable className={cardClass} onPress={handleConnectionsRowTap}>
        <Box className="flex-row items-center gap-2 px-4 pb-1 pt-3.5">
          <Text className="flex-1 text-[15px] font-medium text-brand-text">Connections</Text>
          {pendingIncoming.length > 0 && (
            <Box className="h-[22px] min-w-[22px] items-center justify-center rounded-full bg-brand-danger px-1.5">
              <Text className="text-xs font-bold text-typography-white">
                {pendingIncoming.length}
              </Text>
            </Box>
          )}
          <Text className={chevronClass}>›</Text>
        </Box>
        <Text className="px-4 pb-3.5 text-[13px] text-brand-text-muted">
          {accepted.length} connected
        </Text>
      </Pressable>

      <Pressable className={cardClass} onPress={handleLogOut}>
        <Text className="p-4 text-[15px] font-medium text-brand-danger">Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}
