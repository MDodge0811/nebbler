import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';

import { PersonRow } from '@components/people/PersonRow';
import { calendarsUIColors } from '@constants/calendarsUI';
import { useConnections, type HydratedConnection } from '@hooks/useConnections';
import { useCurrentUser } from '@hooks/useCurrentUser';
import type { PeopleStackParamList } from '@navigation/types';
import { acceptConnection, cancelSentRequest, declineConnection } from '@utils/connections';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Nav = NativeStackNavigationProp<PeopleStackParamList, 'Connections'>;

type SectionKey = 'requests' | 'connected' | 'sent';

interface Section {
  key: SectionKey;
  title: string;
  count: number;
  data: HydratedConnection[];
  collapsible?: boolean;
}

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

  const toggleSent = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSentExpanded((v) => !v);
  }, []);

  const sections = useMemo<Section[]>(() => {
    const out: Section[] = [];
    if (pendingIncoming.length > 0) {
      out.push({
        key: 'requests',
        title: 'Requests',
        count: pendingIncoming.length,
        data: pendingIncoming,
      });
    }
    if (accepted.length > 0) {
      out.push({ key: 'connected', title: 'Connected', count: accepted.length, data: accepted });
    }
    if (pendingOutgoing.length > 0) {
      out.push({
        key: 'sent',
        title: 'Sent',
        count: pendingOutgoing.length,
        data: sentExpanded ? pendingOutgoing : [],
        collapsible: true,
      });
    }
    return out;
  }, [pendingIncoming, accepted, pendingOutgoing, sentExpanded]);

  if (isLoading) {
    return (
      <View style={styles.screen}>
        {[0, 1, 2].map((i) => (
          <View key={i} testID="person-row-skeleton" style={styles.skeleton} />
        ))}
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No connections yet</Text>
        <Text style={styles.emptySubtitle}>Tap + to find people you know.</Text>
        <Pressable style={styles.cta} onPress={() => navigation.navigate('AddConnection')}>
          <Text style={styles.ctaText}>Add People</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SectionList
      style={styles.screen}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      ItemSeparatorComponent={ItemDivider}
      renderSectionHeader={({ section }) => (
        <SectionHeader
          title={section.title}
          count={section.count}
          collapsible={section.collapsible}
          expanded={section.key === 'sent' ? sentExpanded : true}
          onToggle={section.collapsible ? toggleSent : undefined}
        />
      )}
      renderSectionFooter={() => <View style={styles.sectionFooter} />}
      renderItem={({ section, item }) => {
        const otherUser = hydratedToUser(item);
        if (section.key === 'requests') {
          return (
            <PersonRow
              user={otherUser}
              trailing={
                <View style={styles.rowActions}>
                  <Pressable
                    style={[styles.primaryBtn, submittingId === item.id && styles.btnDisabled]}
                    disabled={submittingId === item.id}
                    onPress={() => {
                      void runMutation(item.id, acceptConnection);
                    }}
                  >
                    <Text style={styles.primaryBtnText}>Accept</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.iconBtn, submittingId === item.id && styles.btnDisabled]}
                    disabled={submittingId === item.id}
                    accessibilityLabel="Decline"
                    onPress={() => {
                      void runMutation(item.id, declineConnection);
                    }}
                  >
                    <Text style={styles.iconBtnText}>✕</Text>
                  </Pressable>
                </View>
              }
            />
          );
        }
        if (section.key === 'connected') {
          return (
            <PersonRow
              user={otherUser}
              trailing={<Text style={styles.chevron}>›</Text>}
              onPress={() => navigation.navigate('PersonProfile', { userId: item.other_user_id })}
            />
          );
        }
        // sent
        return (
          <PersonRow
            user={otherUser}
            trailing={
              <View style={styles.rowActions}>
                <StatusChip label="Pending" tone="warning" />
                <Pressable
                  style={[styles.iconBtn, submittingId === item.id && styles.btnDisabled]}
                  disabled={submittingId === item.id}
                  accessibilityLabel="Cancel"
                  onPress={() => {
                    void runMutation(item.id, cancelSentRequest);
                  }}
                >
                  <Text style={styles.iconBtnText}>✕</Text>
                </Pressable>
              </View>
            }
          />
        );
      }}
    />
  );
}

function SectionHeader({
  title,
  count,
  collapsible,
  expanded,
  onToggle,
}: {
  title: string;
  count: number;
  collapsible?: boolean | undefined;
  expanded: boolean;
  onToggle?: (() => void) | undefined;
}) {
  const content = (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionLabel}>
        {title.toUpperCase()} ({count})
      </Text>
      {collapsible ? <Text style={styles.sectionChevron}>{expanded ? '▾' : '▸'}</Text> : null}
    </View>
  );
  if (onToggle) {
    return (
      <Pressable onPress={onToggle} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }
  return content;
}

function StatusChip({ label, tone }: { label: string; tone: 'warning' | 'muted' }) {
  const color = tone === 'warning' ? '#A07300' : calendarsUIColors.textMuted;
  const bg = tone === 'warning' ? '#FFF6E0' : calendarsUIColors.surfaceHover;
  const border = tone === 'warning' ? '#F4D58D' : calendarsUIColors.border;
  return (
    <View style={[styles.chip, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

function ItemDivider() {
  return <View style={styles.itemDivider} />;
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
  screen: { flex: 1, backgroundColor: calendarsUIColors.background },
  content: { paddingBottom: 24 },

  // Section header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: calendarsUIColors.textMuted,
    letterSpacing: 0.3,
  },
  sectionChevron: {
    color: calendarsUIColors.textMuted,
    fontSize: 14,
  },
  sectionFooter: { height: 0 },
  itemDivider: {
    height: 1,
    backgroundColor: calendarsUIColors.border,
    marginLeft: 68, // align with avatar trailing edge (16 padding + 40 avatar + 12 gap)
  },

  // Row trailing widgets
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryBtn: {
    backgroundColor: calendarsUIColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, letterSpacing: 0.1 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: calendarsUIColors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { color: calendarsUIColors.textSecondary, fontSize: 16 },
  btnDisabled: { opacity: 0.5 },
  chevron: { color: calendarsUIColors.textMuted, fontSize: 20 },

  // Status chip (Pending)
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  chipText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 6,
    backgroundColor: calendarsUIColors.background,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: calendarsUIColors.text },
  emptySubtitle: {
    fontSize: 14,
    color: calendarsUIColors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  cta: {
    backgroundColor: calendarsUIColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  // Skeleton
  skeleton: {
    height: 56,
    backgroundColor: calendarsUIColors.surfaceHover,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 6,
  },
});
