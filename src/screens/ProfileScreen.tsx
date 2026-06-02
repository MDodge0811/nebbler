import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AvatarCircle } from '@components/ui/AvatarCircle';
import { ColorSwatchGrid } from '@components/ui/ColorSwatchGrid';
import { calendarsUIColors } from '@constants/calendarsUI';
import { useAuth } from '@hooks/useAuth';
import { useConnections, useUserProfile } from '@hooks/useConnections';
import { useCurrentUser, useCurrentUserMutations } from '@hooks/useCurrentUser';
import type { RootStackParamList } from '@navigation/types';
import { displayName } from '@utils/displayName';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Nav = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

type AvatarProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_color: string | null;
};

function ChevronRight() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M6 4L10 8L6 12"
        stroke={calendarsUIColors.textMuted}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronToggle({ expanded }: { expanded: boolean }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d={expanded ? 'M4 10L8 6L12 10' : 'M6 4L10 8L6 12'}
        stroke={calendarsUIColors.textMuted}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface AvatarCardProps {
  profile: AvatarProfile;
  name: string;
  email: string | null | undefined;
  expanded: boolean;
  onToggle: () => void;
  onColorChange: (hex: string) => Promise<void>;
}

function AvatarCard({ profile, name, email, expanded, onToggle, onColorChange }: AvatarCardProps) {
  return (
    <View style={styles.card}>
      <Pressable style={styles.avatarRow} onPress={onToggle}>
        <AvatarCircle user={profile} size={56} />
        <View style={styles.avatarMeta}>
          <Text style={styles.avatarName}>{name}</Text>
          {email ? <Text style={styles.avatarEmail}>{email}</Text> : null}
        </View>
        <ChevronToggle expanded={expanded} />
      </Pressable>
      {expanded && (
        <>
          <View style={styles.dividerInset} />
          <View style={styles.swatchWrap}>
            <ColorSwatchGrid
              value={profile.avatar_color ?? calendarsUIColors.primary}
              onChange={(hex) => {
                void onColorChange(hex);
              }}
            />
          </View>
        </>
      )}
    </View>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user: me } = useCurrentUser();
  const { signOut, user: authUser } = useAuth();
  const { updateAvatarColor } = useCurrentUserMutations();
  const { user: profile } = useUserProfile(me?.id);
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
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Loading…</Text>
      </View>
    );
  }

  const name = displayName({
    id: profile.id,
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: authUser?.email ?? null,
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <AvatarCard
        profile={profile}
        name={name}
        email={authUser?.email}
        expanded={expanded}
        onToggle={toggleExpanded}
        onColorChange={handleColorChange}
      />

      <Pressable style={styles.card} onPress={handleConnectionsRowTap}>
        <View style={styles.connectionsRow}>
          <Text style={styles.rowLabel}>Connections</Text>
          {pendingIncoming.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingIncoming.length}</Text>
            </View>
          )}
          <ChevronRight />
        </View>
        <Text style={styles.rowSub}>{accepted.length} connected</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={handleLogOut}>
        <Text style={styles.logout}>Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: calendarsUIColors.background },
  content: { paddingVertical: 12, gap: 12 },

  // Card
  card: {
    marginHorizontal: 12,
    backgroundColor: calendarsUIColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
    overflow: 'hidden',
  },

  // Avatar row
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  avatarMeta: { flex: 1, gap: 2 },
  avatarName: { fontSize: 16, fontWeight: '600', color: calendarsUIColors.text },
  avatarEmail: { fontSize: 13, color: calendarsUIColors.textMuted },
  dividerInset: {
    height: 1,
    backgroundColor: calendarsUIColors.border,
    marginHorizontal: 16,
  },
  swatchWrap: { padding: 12 },

  // Connections row
  connectionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 8,
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: calendarsUIColors.text },
  rowSub: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    fontSize: 13,
    color: calendarsUIColors.textMuted,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: calendarsUIColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  // Log out
  logout: { padding: 16, color: calendarsUIColors.danger, fontSize: 15, fontWeight: '600' },

  // Empty
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: calendarsUIColors.background,
  },
  emptyTitle: { fontSize: 16, color: calendarsUIColors.textMuted },
});
