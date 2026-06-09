import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { PersonRow } from '@components/people/PersonRow';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { useDebouncedValue } from '@hooks/useDebouncedValue';
import type { PeopleStackParamList } from '@navigation/types';
import { searchUsers, RateLimitedError } from '@utils/userSearch';

type Nav = NativeStackNavigationProp<PeopleStackParamList, 'AddConnection'>;

type SearchUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_color: string | null;
};

export function AddConnectionScreen() {
  const navigation = useNavigation<Nav>();
  useCurrentUser(); // establishes auth context; mutations re-added in FE-4
  const { show } = useToast();
  const showToastRef = useRef(show);
  showToastRef.current = show;

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);

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

  const handleConnectPlaceholder = () => {
    Alert.alert(
      'Coming Soon',
      'Connecting will be available shortly — online connection requests are coming in a future update.'
    );
  };

  const renderTrailing = (_result: SearchUser) => (
    <Pressable
      className="rounded-lg bg-brand-primary px-[14px] py-[7px] opacity-50"
      onPress={handleConnectPlaceholder}
      testID="connect-placeholder"
    >
      <Text className="text-[13px] font-semibold text-typography-white">Connect</Text>
    </Pressable>
  );

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
