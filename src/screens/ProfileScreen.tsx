import { usePowerSync } from '@powersync/react';
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

import { AvatarCircle } from '@components/ui/AvatarCircle';
import { ColorSwatchGrid } from '@components/ui/ColorSwatchGrid';
import { useAuth } from '@hooks/useAuth';
import { useConnections, useUserProfile } from '@hooks/useConnections';
import { useCurrentUser } from '@hooks/useCurrentUser';
import type { RootStackParamList } from '@navigation/types';
import { displayName } from '@utils/displayName';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Nav = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user: me } = useCurrentUser();
  const { signOut, user: authUser } = useAuth();
  const powersync = usePowerSync();
  const profile = useUserProfile(me?.id);
  const { pendingIncoming, accepted } = useConnections(me?.id);

  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const handleColorChange = async (hex: string) => {
    if (!me?.id) return;
    await powersync.execute('UPDATE users SET avatar_color = ?, updated_at = ? WHERE id = ?', [
      hex.toUpperCase(),
      new Date().toISOString(),
      me.id,
    ]);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Pressable style={styles.avatarRow} onPress={toggleExpanded}>
          <AvatarCircle user={profile} size={56} />
          <View style={styles.avatarMeta}>
            <Text style={styles.avatarName}>{name}</Text>
            {authUser?.email ? <Text style={styles.avatarEmail}>{authUser.email}</Text> : null}
          </View>
          <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
        </Pressable>
        {expanded && (
          <>
            <View style={styles.divider} />
            <ColorSwatchGrid
              value={profile.avatar_color ?? '#00DB74'}
              onChange={(hex) => {
                void handleColorChange(hex);
              }}
            />
          </>
        )}
      </View>

      <Pressable style={styles.card} onPress={handleConnectionsRowTap}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Connections</Text>
          {pendingIncoming.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingIncoming.length}</Text>
            </View>
          )}
          <Text style={styles.chevron}>›</Text>
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
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { paddingVertical: 12, gap: 12 },
  card: {
    marginHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8EC',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  avatarMeta: { flex: 1 },
  avatarName: { fontSize: 16, fontWeight: '600', color: '#1A1A1F' },
  avatarEmail: { fontSize: 13, color: '#9B9BA8', marginTop: 2 },
  chevron: { color: '#9B9BA8', fontSize: 18 },
  divider: { height: 1, backgroundColor: '#F0F0F3', marginHorizontal: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 8,
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1A1A1F' },
  rowSub: { paddingHorizontal: 16, paddingBottom: 14, fontSize: 13, color: '#9B9BA8' },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  logout: { padding: 16, color: '#FF6B6B', fontSize: 15, fontWeight: '500' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, color: '#9B9BA8' },
});
