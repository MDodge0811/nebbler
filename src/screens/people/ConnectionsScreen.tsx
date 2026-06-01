import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
} from 'react-native';

import { PersonRow } from '@components/people/PersonRow';
import { useConnections, type HydratedConnection } from '@hooks/useConnections';
import { useCurrentUser } from '@hooks/useCurrentUser';
import type { PeopleStackParamList } from '@navigation/types';
import { acceptConnection, declineConnection, cancelSentRequest } from '@utils/connections';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Nav = NativeStackNavigationProp<PeopleStackParamList, 'Connections'>;

export function ConnectionsScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useCurrentUser();
  const { pendingIncoming, accepted, pendingOutgoing, isLoading } = useConnections(user?.id);
  const [sentExpanded, setSentExpanded] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const runMutation = useCallback(
    async (id: string, fn: (id: string) => Promise<void>) => {
      if (submittingId) return;
      setSubmittingId(id);
      try {
        await fn(id);
      } finally {
        setSubmittingId(null);
      }
    },
    [submittingId]
  );

  const toggleSent = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSentExpanded((v) => !v);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        {[0, 1, 2].map((i) => (
          <View key={i} testID="person-row-skeleton" style={styles.skeleton} />
        ))}
      </View>
    );
  }

  const isEmpty =
    pendingIncoming.length === 0 && accepted.length === 0 && pendingOutgoing.length === 0;

  if (isEmpty) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No connections yet</Text>
        <Text style={styles.emptySubtitle}>Tap + to find people you know.</Text>
        <Pressable style={styles.cta} onPress={() => navigation.navigate('AddConnection')}>
          <Text style={styles.ctaText}>Add People</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {pendingIncoming.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Requests ({pendingIncoming.length})</Text>
          {pendingIncoming.map((c) => (
            <PersonRow
              key={c.id}
              user={hydratedToUser(c)}
              trailing={
                <View style={styles.rowActions}>
                  <Pressable
                    style={[styles.primaryBtn, submittingId === c.id && styles.btnDisabled]}
                    disabled={submittingId === c.id}
                    onPress={() => {
                      void runMutation(c.id, acceptConnection);
                    }}
                  >
                    <Text style={styles.primaryBtnText}>Accept</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.iconBtn, submittingId === c.id && styles.btnDisabled]}
                    disabled={submittingId === c.id}
                    accessibilityLabel="Decline"
                    onPress={() => {
                      void runMutation(c.id, declineConnection);
                    }}
                  >
                    <Text style={styles.iconBtnText}>✕</Text>
                  </Pressable>
                </View>
              }
            />
          ))}
        </View>
      )}

      {accepted.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Connected ({accepted.length})</Text>
          {accepted.map((c) => (
            <PersonRow
              key={c.id}
              user={hydratedToUser(c)}
              trailing={<Text style={styles.chevron}>›</Text>}
              onPress={() => navigation.navigate('PersonProfile', { userId: c.other_user_id })}
            />
          ))}
        </View>
      )}

      {pendingOutgoing.length > 0 && (
        <View style={styles.section}>
          <Pressable onPress={toggleSent} style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Sent ({pendingOutgoing.length})</Text>
            <Text style={styles.chevron}>{sentExpanded ? '▾' : '▸'}</Text>
          </Pressable>
          {sentExpanded &&
            pendingOutgoing.map((c) => (
              <PersonRow
                key={c.id}
                user={hydratedToUser(c)}
                trailing={
                  <View style={styles.rowActions}>
                    <Text style={styles.pendingLabel}>Pending</Text>
                    <Pressable
                      style={[styles.iconBtn, submittingId === c.id && styles.btnDisabled]}
                      disabled={submittingId === c.id}
                      accessibilityLabel="Cancel"
                      onPress={() => {
                        void runMutation(c.id, cancelSentRequest);
                      }}
                    >
                      <Text style={styles.iconBtnText}>✕</Text>
                    </Pressable>
                  </View>
                }
              />
            ))}
        </View>
      )}

      {submittingId && <ActivityIndicator size="small" style={styles.submittingSpinner} />}
    </ScrollView>
  );
}

function hydratedToUser(c: HydratedConnection) {
  return {
    id: c.other_user_id,
    first_name: c.first_name,
    last_name: c.last_name,
    email: null,
    avatar_color: c.avatar_color,
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { paddingVertical: 12 },
  section: { marginBottom: 16 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6B78',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryBtn: {
    backgroundColor: '#00DB74',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { color: '#6B6B78', fontSize: 16 },
  btnDisabled: { opacity: 0.5 },
  pendingLabel: { color: '#9B9BA8', fontSize: 13 },
  chevron: { color: '#9B9BA8', fontSize: 16 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1F' },
  emptySubtitle: { fontSize: 14, color: '#6B6B78', marginBottom: 16 },
  cta: {
    backgroundColor: '#00DB74',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaText: { color: '#fff', fontWeight: '600' },
  skeleton: {
    height: 56,
    backgroundColor: '#F0F0F3',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  submittingSpinner: { marginTop: 16 },
});
