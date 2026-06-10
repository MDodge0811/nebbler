import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';

import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { PersonRow } from '@components/people/PersonRow';
import type { UserSearchResult } from '@database/schemas';
import { useResolveRequest, useSendRequest } from '@hooks/useConnectionsApi';
import { useDebouncedValue } from '@hooks/useDebouncedValue';
import { useOnlineAction } from '@hooks/useOnlineAction';
import { useUserSearch } from '@hooks/useUserSearch';
import type { PeopleStackParamList } from '@navigation/types';
import { relationshipToAction, type RelationshipAction } from '@utils/relationship';

type Nav = NativeStackNavigationProp<PeopleStackParamList, 'AddConnection'>;

export function AddConnectionScreen() {
  const navigation = useNavigation<Nav>();
  const { show } = useToast();
  const showRef = useRef(show);
  showRef.current = show;

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const { data, isFetching, error, refetch } = useUserSearch(debouncedQuery);

  const send = useOnlineAction(useSendRequest());
  const respond = useOnlineAction(useResolveRequest());
  const disabled = !send.isConnected || send.isPending || respond.isPending;

  // Surface search transport errors (429 rate-limit vs. network) as a toast.
  useEffect(() => {
    if (!error) return;
    const rateLimited = error instanceof Error && error.name === 'RateLimitedError';
    showRef.current({
      id: rateLimited ? 'search-rate-limited' : 'search-error',
      placement: 'top',
      title: rateLimited
        ? 'Slow down a moment — try again in a few seconds.'
        : "Couldn't reach the server. Check your connection.",
    });
  }, [error]);

  const toastResult = (id: string, message: string) =>
    showRef.current({ id, placement: 'top', title: message });

  const onConnect = (result: UserSearchResult) => {
    void send.run(result.id).then((r) => {
      if (r.status === 'success') {
        void refetch();
      } else if (r.status === 'error' && extractCode(r.error) === 'inbound_request_exists') {
        // The other user already requested us — flip the row to "Accept", don't error.
        void refetch();
        toastResult(`inbound-${result.id}`, 'They already sent you a request — accept it below.');
      } else {
        toastResult(`connect-${result.id}`, r.message);
      }
    });
  };

  const onAccept = (result: UserSearchResult, requestId: string) => {
    void respond.run({ id: requestId, status: 'accepted' }).then((r) => {
      if (r.status === 'success') void refetch();
      else toastResult(`accept-${result.id}`, r.message);
    });
  };

  const results = data ?? [];
  const showPrompt = debouncedQuery.trim().length < 2;
  const showEmpty = !showPrompt && !isFetching && results.length === 0;

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
          placeholder="Search by name or @username"
          placeholderTextColor="#9B9BA8"
          returnKeyType="search"
          autoCapitalize="none"
          className="flex-1 text-[15px] text-brand-text"
        />
        {isFetching ? <ActivityIndicator size="small" /> : null}
        {query.length > 0 && !isFetching && (
          <Pressable accessibilityLabel="Clear" onPress={() => setQuery('')}>
            <Text className="px-1 text-base text-brand-text-muted">✕</Text>
          </Pressable>
        )}
      </Box>

      {showPrompt && (
        <Box className="items-center gap-1 p-6">
          <Text className="text-center text-sm text-brand-text-secondary">
            Search by name or @username
          </Text>
          <Text className="text-center text-xs text-brand-text-muted">
            Find people to connect with and share calendars.
          </Text>
        </Box>
      )}

      {showEmpty && (
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
            user={item}
            subtitle={item.username ? `@${item.username}` : undefined}
            trailing={
              <TrailingAction
                action={relationshipToAction(item.relationship)}
                disabled={disabled}
                onConnect={() => onConnect(item)}
                onAccept={(requestId) => onAccept(item, requestId)}
              />
            }
            onPress={() => navigation.navigate('PersonProfile', { userId: item.id })}
          />
        )}
      />
    </KeyboardAvoidingView>
  );
}

function extractCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'code' in err) {
    return String(err.code);
  }
  return undefined;
}

function TrailingAction({
  action,
  disabled,
  onConnect,
  onAccept,
}: {
  action: RelationshipAction;
  disabled: boolean;
  onConnect: () => void;
  onAccept: (requestId: string) => void;
}) {
  switch (action.kind) {
    case 'connect':
      return (
        <Pressable
          onPress={onConnect}
          disabled={disabled}
          accessibilityRole="button"
          className={`rounded-[10px] bg-brand-primary px-3.5 py-[7px] ${disabled ? 'opacity-50' : ''}`}
        >
          <Text className="text-[13px] font-semibold text-typography-white">Connect</Text>
        </Pressable>
      );
    case 'respond':
      return (
        <Pressable
          onPress={() => onAccept(action.requestId)}
          disabled={disabled}
          accessibilityRole="button"
          className={`rounded-[10px] bg-brand-primary px-3.5 py-[7px] ${disabled ? 'opacity-50' : ''}`}
        >
          <Text className="text-[13px] font-semibold text-typography-white">Accept</Text>
        </Pressable>
      );
    case 'cancel':
      return <StateChip label="Pending" />;
    case 'open':
      return <StateChip label="Connected" />;
    case 'self':
      return null;
  }
}

function StateChip({ label }: { label: string }) {
  return (
    <Box className="rounded-[10px] border border-brand-border bg-brand-surface-muted px-3.5 py-[7px]">
      <Text className="text-[13px] font-semibold text-brand-text-muted">{label}</Text>
    </Box>
  );
}
