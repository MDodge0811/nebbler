import { Alert, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useUserProfile,
  useConnectionWith,
  useSharedCalendars,
  useSharedCalendarCount,
} from '@hooks/useConnections';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { removeConnection, blockUser } from '@utils/connections';
import { useToast } from '@/components/ui/toast';
import { AvatarCircle } from '@components/ui/AvatarCircle';
import { displayName } from '@utils/displayName';
import type { PeopleStackParamList, RootStackParamList } from '@navigation/types';

type ScreenRoute = RouteProp<PeopleStackParamList, 'PersonProfile'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatMonthYear(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

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
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>This person isn't available.</Text>
      </View>
    );
  }

  const name = displayName({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: null,
  });

  const handleFindTime = () => {
    toast.show({
      id: 'find-a-time-coming-soon',
      placement: 'top',
      title: 'Find a Time is coming soon.',
    });
  };

  const handleRemove = () => {
    if (!connection) return;
    Alert.alert(
      'Remove Connection?',
      `Removing ${name} will also remove them from any shared calendars.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeConnection(connection.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleBlock = () => {
    if (!currentUserId) return;
    Alert.alert(
      `Block ${name}?`,
      "This will remove the connection and prevent all future interaction. They won't be notified.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            await blockUser(userId, currentUserId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <AvatarCircle user={user} size={80} />
        <Text style={styles.name}>{name}</Text>

        <StatusPill status={connection?.status ?? null} />

        <View style={styles.metaRow}>
          <View style={styles.metaTile}>
            <Text style={styles.metaValue}>{sharedCount}</Text>
            <Text style={styles.metaLabel}>Shared</Text>
          </View>
          {connection?.status === 'accepted' && (
            <>
              <View style={styles.metaDivider} />
              <View style={styles.metaTile}>
                <Text style={styles.metaSmallLabel}>Since</Text>
                <Text style={styles.metaSmallValue}>
                  {formatMonthYear((connection as { updated_at?: string }).updated_at ?? '')}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      <Pressable style={[styles.cta, styles.ctaDisabled]} onPress={handleFindTime}>
        <ClockIcon />
        <Text style={styles.ctaText}>Find a Time</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>SHARED CALENDARS</Text>
      <View style={styles.sectionCard}>
        {sharedCalendars.length > 0 ? (
          sharedCalendars.map((cal) => (
            <Pressable
              key={cal.id}
              style={styles.calendarRow}
              onPress={() => navigation.navigate('CalendarDetail', { calendarId: cal.id })}
            >
              <View
                style={[
                  styles.calIcon,
                  {
                    backgroundColor: `${cal.color ?? '#9B9BA8'}15`,
                    borderColor: `${cal.color ?? '#9B9BA8'}30`,
                  },
                ]}
              />
              <Text style={styles.calName}>{cal.name}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptyText}>You don't share any calendars with {name} yet.</Text>
        )}
      </View>

      <Text style={styles.sectionLabel}>CONNECTION</Text>
      <View style={styles.sectionCard}>
        <Pressable style={styles.dangerRow} onPress={handleRemove} disabled={!connection}>
          <View style={styles.dangerIconSlot}>
            <Text style={styles.dangerIcon}>⊖</Text>
          </View>
          <View style={styles.dangerTextSlot}>
            <Text style={styles.dangerLabel}>Remove Connection</Text>
            <Text style={styles.dangerSub}>Also removes from shared calendars</Text>
          </View>
        </Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.dangerRow} onPress={handleBlock}>
          <View style={styles.dangerIconSlot}>
            <Text style={styles.dangerIcon}>⊘</Text>
          </View>
          <View style={styles.dangerTextSlot}>
            <Text style={styles.dangerLabel}>Block</Text>
            <Text style={styles.dangerSub}>Prevents all future interaction</Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function StatusPill({ status }: { status: string | null }) {
  if (status === 'accepted') {
    return (
      <View style={[styles.pill, { backgroundColor: '#E8FBF1', borderColor: '#A8EDCB' }]}>
        <View style={[styles.pillDot, { backgroundColor: '#00DB74' }]} />
        <Text style={[styles.pillText, { color: '#00DB74' }]}>Connected</Text>
      </View>
    );
  }
  if (status === 'pending') {
    return (
      <View style={[styles.pill, { backgroundColor: '#FFF6E0', borderColor: '#F4D58D' }]}>
        <View style={[styles.pillDot, { backgroundColor: '#FFB347' }]} />
        <Text style={[styles.pillText, { color: '#A07300' }]}>Request Pending</Text>
      </View>
    );
  }
  return <Text style={styles.notConnected}>Not connected</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { paddingVertical: 12 },
  card: {
    margin: 12,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E8EC',
    alignItems: 'center',
    gap: 8,
  },
  name: { fontSize: 22, fontWeight: '700', color: '#1A1A1F' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontSize: 13, fontWeight: '600' },
  notConnected: { color: '#9B9BA8', fontSize: 13, marginTop: 8 },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F3',
  },
  metaTile: { alignItems: 'center', minWidth: 60 },
  metaDivider: { width: 1, backgroundColor: '#F0F0F3' },
  metaValue: { fontSize: 16, fontWeight: '700', color: '#1A1A1F' },
  metaLabel: { fontSize: 12, color: '#9B9BA8', marginTop: 2 },
  metaSmallLabel: { fontSize: 12, color: '#6B6B78', fontWeight: '500' },
  metaSmallValue: { fontSize: 12, color: '#9B9BA8', marginTop: 2 },
  cta: {
    margin: 12,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#00DB74',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  sectionLabel: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#9B9BA8',
    letterSpacing: 0.3,
  },
  sectionCard: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E8EC',
    overflow: 'hidden',
  },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  calIcon: { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5 },
  calName: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1A1A1F' },
  chevron: { color: '#9B9BA8', fontSize: 16 },
  emptyText: { padding: 20, color: '#9B9BA8', textAlign: 'center', fontSize: 14 },
  divider: { height: 1, backgroundColor: '#F0F0F3', marginLeft: 44 },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  dangerIconSlot: { width: 16, alignItems: 'center' },
  dangerIcon: { color: '#FF6B6B', fontSize: 16 },
  dangerTextSlot: { flex: 1 },
  dangerLabel: { fontSize: 15, fontWeight: '500', color: '#FF6B6B' },
  dangerSub: { fontSize: 12, color: '#9B9BA8', marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 16, color: '#6B6B78' },
});
