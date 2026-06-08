import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { PersonRow } from '@components/people/PersonRow';
import { useConnections } from '@hooks/useConnections';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { useDebouncedValue } from '@hooks/useDebouncedValue';
import type { PeopleStackParamList } from '@navigation/types';
import { sendConnectionRequest, acceptConnection } from '@utils/connections';
import { searchUsers, RateLimitedError } from '@utils/userSearch';

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

const primaryBtnStyle = tva({
  base: 'rounded-lg bg-brand-primary px-[14px] py-[7px]',
  variants: { disabled: { true: 'opacity-50' } },
});

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
        if (!cancelled) setResults(data);
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
    const isSubmitting = submittingId === result.id || submittingId === state?.connectionId;
    if (!state) {
      return (
        <Pressable
          className={primaryBtnStyle({ disabled: !!isSubmitting })}
          disabled={!!isSubmitting}
          onPress={() => {
            void handleConnect(result.id);
          }}
        >
          <Text className="text-[13px] font-semibold text-typography-white">Connect</Text>
        </Pressable>
      );
    }
    if (state.kind === 'incoming') {
      return (
        <Pressable
          className={primaryBtnStyle({ disabled: !!isSubmitting })}
          disabled={!!isSubmitting}
          onPress={() => {
            void handleAccept(state.connectionId);
          }}
        >
          <Text className="text-[13px] font-semibold text-typography-white">Accept</Text>
        </Pressable>
      );
    }
    if (state.kind === 'outgoing') {
      return <Text className="text-[13px] font-medium text-brand-text-muted">Pending</Text>;
    }
    return <Text className="text-[13px] font-semibold text-brand-primary">Connected</Text>;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-brand-surface-subtle"
    >
      <Box className="m-3 flex-row items-center gap-2 rounded-xl border border-brand-border bg-background-0 p-2.5">
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or email"
          placeholderTextColor="#9B9BA8"
          returnKeyType="search"
          className="flex-1 text-[15px] text-brand-text"
        />
        {searching ? <ActivityIndicator size="small" /> : null}
        {query.length > 0 && !searching && (
          <Pressable accessibilityLabel="Clear" onPress={() => setQuery('')}>
            <Text className="px-1 text-base text-brand-text-muted">✕</Text>
          </Pressable>
        )}
      </Box>

      {debouncedQuery.trim().length < 2 && (
        <Box className="items-center gap-1 p-6">
          <Text className="text-center text-sm text-brand-text-secondary">
            Search by name or email
          </Text>
          <Text className="text-center text-xs text-brand-text-muted">
            You'll need an exact name match or partial email.
          </Text>
        </Box>
      )}

      {debouncedQuery.trim().length >= 2 && !searching && results.length === 0 && (
        <Box className="items-center gap-1 p-6">
          <Text className="text-center text-sm text-brand-text-secondary">
            No people found matching "{debouncedQuery}"
          </Text>
        </Box>
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
