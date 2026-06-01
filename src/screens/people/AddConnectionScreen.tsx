import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchUsers, RateLimitedError } from '@utils/userSearch';
import { sendConnectionRequest, acceptConnection } from '@utils/connections';
import { useConnections } from '@hooks/useConnections';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { useDebouncedValue } from '@hooks/useDebouncedValue';
import { useToast } from '@/components/ui/toast';
import { PersonRow } from '@components/people/PersonRow';
import type { PeopleStackParamList } from '@navigation/types';

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

export function AddConnectionScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useCurrentUser();
  const currentUserId = user?.id;
  const { show } = useToast();
  const showToastRef = useRef(show);
  showToastRef.current = show;
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
        if (!cancelled) setResults(data as SearchUser[]);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof RateLimitedError) {
          showToastRef.current({
            id: 'rate-limited',
            placement: 'top',
            title: 'Slow down a moment — try again in a few seconds.',
          });
        } else {
          showToastRef.current({
            id: 'search-error',
            placement: 'top',
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
  }, [debouncedQuery]);

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
    const isSubmitting =
      submittingId === result.id || (state && submittingId === state.connectionId);
    if (!state) {
      return (
        <Pressable
          style={[styles.primaryBtn, isSubmitting && styles.btnDisabled]}
          disabled={!!isSubmitting}
          onPress={() => handleConnect(result.id)}
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
          onPress={() => handleAccept(state.connectionId)}
        >
          <Text style={styles.primaryBtnText}>Accept</Text>
        </Pressable>
      );
    }
    if (state.kind === 'outgoing') {
      return <Text style={styles.pendingChip}>Pending</Text>;
    }
    return <Text style={styles.connectedChip}>Connected</Text>;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.searchBox}>
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or email"
          placeholderTextColor="#9B9BA8"
          returnKeyType="search"
          style={styles.searchInput}
        />
        {searching ? <ActivityIndicator size="small" /> : null}
        {query.length > 0 && !searching && (
          <Pressable accessibilityLabel="Clear" onPress={() => setQuery('')}>
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
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8EC',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1A1F' },
  clear: { color: '#9B9BA8', fontSize: 16, paddingHorizontal: 4 },
  hintBox: { padding: 24, alignItems: 'center', gap: 4 },
  hintTitle: { color: '#6B6B78', fontSize: 14, textAlign: 'center' },
  hintSub: { color: '#9B9BA8', fontSize: 12, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: '#00DB74',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  btnDisabled: { opacity: 0.5 },
  pendingChip: { color: '#9B9BA8', fontSize: 13, fontWeight: '500' },
  connectedChip: { color: '#00DB74', fontSize: 13, fontWeight: '600' },
});
