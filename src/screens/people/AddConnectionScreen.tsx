import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { PersonRow } from '@components/people/PersonRow';
import { calendarsUIColors } from '@constants/calendarsUI';
import { useConnections } from '@hooks/useConnections';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { useDebouncedValue } from '@hooks/useDebouncedValue';
import { useToast } from '@hooks/useToast';
import type { PeopleStackParamList } from '@navigation/types';
import { acceptConnection, sendConnectionRequest } from '@utils/connections';
import { RateLimitedError, searchUsers } from '@utils/userSearch';

type Nav = NativeStackNavigationProp<PeopleStackParamList, 'AddConnection'>;

type ConnectionState =
  | { kind: 'incoming'; connectionId: string }
  | { kind: 'outgoing'; connectionId: string }
  | { kind: 'accepted'; connectionId: string };

type SearchUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_color: string | null;
};

function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Circle cx={8} cy={8} r={5.5} stroke={calendarsUIColors.textMuted} strokeWidth={1.5} />
      <Path
        d="M12 12L16 16"
        stroke={calendarsUIColors.textMuted}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function AddConnectionScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useCurrentUser();
  const currentUserId = user?.id;
  const { show: showToast } = useToast();
  const { pendingIncoming, accepted, pendingOutgoing } = useConnections(currentUserId);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const stateByUserId = useMemo(() => {
    const map = new Map<string, ConnectionState>();
    pendingIncoming.forEach((c) =>
      map.set(c.requester_id, { kind: 'incoming', connectionId: c.id })
    );
    pendingOutgoing.forEach((c) =>
      map.set(c.addressee_id, { kind: 'outgoing', connectionId: c.id })
    );
    accepted.forEach((c) => {
      const otherId = c.requester_id === currentUserId ? c.addressee_id : c.requester_id;
      map.set(otherId, { kind: 'accepted', connectionId: c.id });
    });
    return map;
  }, [pendingIncoming, accepted, pendingOutgoing, currentUserId]);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchUsers(debouncedQuery)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof RateLimitedError) {
          showToast({
            id: 'rate-limited',
            placement: 'top',
            action: 'warning',
            title: 'Slow down a moment — try again in a few seconds.',
          });
        } else {
          showToast({
            id: 'search-error',
            placement: 'top',
            action: 'error',
            title: "Couldn't reach the server. Check your connection.",
          });
        }
        setResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, showToast]);

  const handleConnect = useCallback(
    async (addresseeId: string) => {
      if (submittingId || !currentUserId) return;
      setSubmittingId(addresseeId);
      try {
        await sendConnectionRequest(addresseeId, currentUserId);
      } finally {
        setSubmittingId(null);
      }
    },
    [submittingId, currentUserId]
  );

  const handleAccept = useCallback(
    async (connectionId: string) => {
      if (submittingId) return;
      setSubmittingId(connectionId);
      try {
        await acceptConnection(connectionId);
      } finally {
        setSubmittingId(null);
      }
    },
    [submittingId]
  );

  const renderTrailing = (result: SearchUser) => {
    const state = stateByUserId.get(result.id);
    const isSubmitting = submittingId === result.id || submittingId === state?.connectionId;
    if (!state) {
      return (
        <Pressable
          style={[styles.primaryBtn, isSubmitting && styles.btnDisabled]}
          disabled={!!isSubmitting}
          onPress={() => {
            void handleConnect(result.id);
          }}
        >
          <Text style={styles.primaryBtnText}>Connect</Text>
        </Pressable>
      );
    }
    if (state.kind === 'incoming') {
      return (
        <Pressable
          style={[styles.primaryBtn, isSubmitting && styles.btnDisabled]}
          disabled={!!isSubmitting}
          onPress={() => {
            void handleAccept(state.connectionId);
          }}
        >
          <Text style={styles.primaryBtnText}>Accept</Text>
        </Pressable>
      );
    }
    if (state.kind === 'outgoing') {
      return (
        <View style={[styles.chip, styles.chipMuted]}>
          <Text style={[styles.chipText, styles.chipTextMuted]}>Pending</Text>
        </View>
      );
    }
    return (
      <View style={[styles.chip, styles.chipConnected]}>
        <Text style={[styles.chipText, styles.chipTextConnected]}>Connected</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <View style={styles.searchBox}>
        <SearchIcon />
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or email"
          placeholderTextColor={calendarsUIColors.textMuted}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {searching ? <ActivityIndicator size="small" color={calendarsUIColors.textMuted} /> : null}
        {query.length > 0 && !searching && (
          <Pressable accessibilityLabel="Clear" hitSlop={8} onPress={() => setQuery('')}>
            <Text style={styles.clear}>✕</Text>
          </Pressable>
        )}
      </View>

      {debouncedQuery.trim().length < 2 && (
        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>Search by name or email</Text>
          <Text style={styles.hintSub}>You'll need an exact name match or partial email.</Text>
        </View>
      )}

      {debouncedQuery.trim().length >= 2 && !searching && results.length === 0 && (
        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>No people found matching "{debouncedQuery}"</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(u) => u.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <PersonRow
            user={{ ...item, email: null }}
            trailing={renderTrailing(item)}
            onPress={() => navigation.navigate('PersonProfile', { userId: item.id })}
          />
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: calendarsUIColors.background },

  // Search input
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: calendarsUIColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: calendarsUIColors.text,
    paddingVertical: 0, // RN adds default vertical padding on Android
  },
  clear: { color: calendarsUIColors.textMuted, fontSize: 16 },

  // Hint / empty
  hintBox: { padding: 24, alignItems: 'center', gap: 4 },
  hintTitle: { color: calendarsUIColors.textSecondary, fontSize: 14, textAlign: 'center' },
  hintSub: { color: calendarsUIColors.textMuted, fontSize: 12, textAlign: 'center' },

  // Primary button (Connect / Accept)
  primaryBtn: {
    backgroundColor: calendarsUIColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, letterSpacing: 0.1 },
  btnDisabled: { opacity: 0.5 },

  // Status chips (Pending, Connected)
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  chipText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  chipMuted: {
    backgroundColor: calendarsUIColors.surfaceHover,
    borderColor: calendarsUIColors.border,
  },
  chipTextMuted: { color: calendarsUIColors.textMuted },
  chipConnected: {
    backgroundColor: calendarsUIColors.primaryLight,
    borderColor: calendarsUIColors.primaryBorder,
  },
  chipTextConnected: { color: calendarsUIColors.primary },
});
