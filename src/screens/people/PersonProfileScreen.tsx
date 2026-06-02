import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLayoutEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AvatarCircle } from '@components/ui/AvatarCircle';
import { calendarsUIColors } from '@constants/calendarsUI';
import {
  useConnectionWith,
  useSharedCalendarCount,
  useSharedCalendars,
  useUserProfile,
} from '@hooks/useConnections';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { useToast } from '@hooks/useToast';
import type { PeopleStackParamList, RootStackParamList } from '@navigation/types';
import { blockUser, removeConnection } from '@utils/connections';
import { displayName } from '@utils/displayName';

type ScreenRoute = RouteProp<PeopleStackParamList, 'PersonProfile'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatMonthYear(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function ClockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Circle cx="9" cy="9" r="7" stroke="#FFFFFF" strokeWidth={1.5} />
      <Path
        d="M9 5V9L12 11"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

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

function RemoveIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={7.5} stroke={calendarsUIColors.danger} strokeWidth={1.5} />
      <Path
        d="M6 10H14"
        stroke={calendarsUIColors.danger}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function BlockIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={7.5} stroke={calendarsUIColors.danger} strokeWidth={1.5} />
      <Path
        d="M5 5L15 15"
        stroke={calendarsUIColors.danger}
        strokeWidth={1.5}
        strokeLinecap="round"
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
  const { show: showToast } = useToast();

  const { user, isLoading: userLoading } = useUserProfile(userId);
  const connection = useConnectionWith(currentUserId, userId);
  const sharedCalendars = useSharedCalendars(currentUserId, userId);
  const sharedCount = useSharedCalendarCount(currentUserId, userId);

  const name = user
    ? displayName({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: null,
      })
    : '';

  // Show name in the nav header — spec mockup: "[<] Sarah Chen"
  useLayoutEffect(() => {
    if (name) navigation.setOptions({ title: name });
  }, [navigation, name]);

  if (userLoading && !user) {
    return <ProfileSkeleton />;
  }

  if (user === null) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>This person isn't available.</Text>
      </View>
    );
  }

  const handleFindTime = () => {
    showToast({
      id: 'find-a-time-coming-soon',
      placement: 'top',
      action: 'info',
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
          onPress: () => {
            void (async () => {
              await removeConnection(connection.id);
              navigation.goBack();
            })();
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
          onPress: () => {
            void (async () => {
              await blockUser(userId, currentUserId);
              navigation.goBack();
            })();
          },
        },
      ]
    );
  };

  const isAccepted = connection?.status === 'accepted';
  const hasConnection = !!connection;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <AvatarCircle user={user} size={80} />
        <Text style={styles.name}>{name}</Text>

        <StatusPill status={connection?.status ?? null} />

        <View style={styles.metaRow}>
          <View style={styles.metaTile}>
            <Text style={styles.metaValue}>{sharedCount}</Text>
            <Text style={styles.metaLabel}>Shared</Text>
          </View>
          {isAccepted && (
            <>
              <View style={styles.metaDivider} />
              <View style={styles.metaTile}>
                <Text style={styles.metaSmallLabel}>Since</Text>
                <Text style={styles.metaSmallValue}>{formatMonthYear(connection.updated_at)}</Text>
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
      <View style={styles.card}>
        {sharedCalendars.length > 0 ? (
          sharedCalendars.map((cal, idx) => (
            <View key={cal.id}>
              {idx > 0 ? <View style={styles.itemDivider} /> : null}
              <Pressable
                style={styles.calendarRow}
                onPress={() => navigation.navigate('CalendarDetail', { calendarId: cal.id })}
              >
                <View
                  style={[
                    styles.calIcon,
                    {
                      backgroundColor: `${cal.color ?? calendarsUIColors.textMuted}15`,
                      borderColor: `${cal.color ?? calendarsUIColors.textMuted}30`,
                    },
                  ]}
                />
                <Text style={styles.calName} numberOfLines={1}>
                  {cal.name}
                </Text>
                <ChevronRight />
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>You don't share any calendars with {name} yet.</Text>
        )}
      </View>

      <ConnectionActionsSection
        hasConnection={hasConnection}
        onRemove={handleRemove}
        onBlock={handleBlock}
      />
    </ScrollView>
  );
}

function ConnectionActionsSection({
  hasConnection,
  onRemove,
  onBlock,
}: {
  hasConnection: boolean;
  onRemove: () => void;
  onBlock: () => void;
}) {
  return (
    <>
      <Text style={styles.sectionLabel}>CONNECTION</Text>
      <View style={styles.card}>
        {hasConnection ? (
          <>
            <Pressable style={styles.dangerRow} onPress={onRemove}>
              <View style={styles.dangerIconSlot}>
                <RemoveIcon />
              </View>
              <View style={styles.dangerTextSlot}>
                <Text style={styles.dangerLabel}>Remove Connection</Text>
                <Text style={styles.dangerSub}>Also removes from shared calendars</Text>
              </View>
            </Pressable>
            <View style={styles.itemDivider} />
          </>
        ) : null}
        <Pressable style={styles.dangerRow} onPress={onBlock}>
          <View style={styles.dangerIconSlot}>
            <BlockIcon />
          </View>
          <View style={styles.dangerTextSlot}>
            <Text style={styles.dangerLabel}>Block</Text>
            <Text style={styles.dangerSub}>Prevents all future interaction</Text>
          </View>
        </Pressable>
      </View>
    </>
  );
}

function StatusPill({ status }: { status: string | null }) {
  if (status === 'accepted') {
    return (
      <View style={[styles.pill, styles.pillConnected]}>
        <View style={[styles.pillDot, { backgroundColor: calendarsUIColors.primary }]} />
        <Text style={[styles.pillText, { color: calendarsUIColors.primary }]}>Connected</Text>
      </View>
    );
  }
  if (status === 'pending') {
    return (
      <View style={[styles.pill, styles.pillPending]}>
        <View style={[styles.pillDot, { backgroundColor: '#FFB347' }]} />
        <Text style={[styles.pillText, { color: '#A07300' }]}>Request Pending</Text>
      </View>
    );
  }
  return <Text style={styles.notConnected}>Not connected</Text>;
}

function ProfileSkeleton() {
  return (
    <View style={styles.screen}>
      <View style={[styles.profileCard, styles.skeletonCard]}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonNameLine} />
        <View style={styles.skeletonPill} />
      </View>
      <View style={styles.skeletonCta} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: calendarsUIColors.background },
  content: { paddingVertical: 12, paddingBottom: 32 },

  // Profile hero card
  profileCard: {
    margin: 12,
    padding: 24,
    borderRadius: 16,
    backgroundColor: calendarsUIColors.surface,
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
    alignItems: 'center',
    gap: 8,
  },
  name: { fontSize: 22, fontWeight: '700', color: calendarsUIColors.text, marginTop: 4 },

  // Status pill
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  pillConnected: {
    backgroundColor: calendarsUIColors.primaryLight,
    borderColor: calendarsUIColors.primaryBorder,
  },
  pillPending: { backgroundColor: '#FFF6E0', borderColor: '#F4D58D' },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontSize: 13, fontWeight: '600' },
  notConnected: { color: calendarsUIColors.textMuted, fontSize: 13, marginTop: 8 },

  // Meta tiles
  metaRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: calendarsUIColors.border,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  metaTile: { alignItems: 'center', minWidth: 80 },
  metaDivider: { width: 1, backgroundColor: calendarsUIColors.border },
  metaValue: { fontSize: 18, fontWeight: '700', color: calendarsUIColors.text },
  metaLabel: {
    fontSize: 12,
    color: calendarsUIColors.textMuted,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  metaSmallLabel: { fontSize: 12, color: calendarsUIColors.textSecondary, fontWeight: '600' },
  metaSmallValue: { fontSize: 13, color: calendarsUIColors.textMuted, marginTop: 4 },

  // Find a Time CTA
  cta: {
    marginHorizontal: 12,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: calendarsUIColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, letterSpacing: 0.1 },

  // Section label
  sectionLabel: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: calendarsUIColors.textMuted,
    letterSpacing: 0.3,
  },

  // Card (Shared Calendars, Connection)
  card: {
    marginHorizontal: 12,
    borderRadius: 14,
    backgroundColor: calendarsUIColors.surface,
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
    overflow: 'hidden',
  },
  itemDivider: { height: 1, backgroundColor: calendarsUIColors.border, marginLeft: 56 },

  // Calendar row
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  calIcon: { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5 },
  calName: { flex: 1, fontSize: 15, fontWeight: '500', color: calendarsUIColors.text },
  emptyText: {
    padding: 20,
    color: calendarsUIColors.textMuted,
    textAlign: 'center',
    fontSize: 14,
  },

  // Destructive row
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  dangerIconSlot: { width: 28, alignItems: 'center', justifyContent: 'center' },
  dangerTextSlot: { flex: 1 },
  dangerLabel: { fontSize: 15, fontWeight: '600', color: calendarsUIColors.danger },
  dangerSub: { fontSize: 12, color: calendarsUIColors.textMuted, marginTop: 2 },

  // Empty / loading
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: calendarsUIColors.background,
  },
  emptyTitle: { fontSize: 16, color: calendarsUIColors.textSecondary },

  // Skeleton
  skeletonCard: { alignItems: 'center' },
  skeletonAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: calendarsUIColors.surfaceHover,
  },
  skeletonNameLine: {
    height: 22,
    width: 160,
    borderRadius: 6,
    backgroundColor: calendarsUIColors.surfaceHover,
    marginTop: 8,
  },
  skeletonPill: {
    height: 26,
    width: 110,
    borderRadius: 13,
    backgroundColor: calendarsUIColors.surfaceHover,
    marginTop: 8,
  },
  skeletonCta: {
    marginHorizontal: 12,
    marginTop: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: calendarsUIColors.surfaceHover,
  },
});
