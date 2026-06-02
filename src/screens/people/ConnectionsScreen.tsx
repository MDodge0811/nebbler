import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ScrollView, LayoutAnimation, Platform, UIManager, ActivityIndicator } from 'react-native';

import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { PersonRow } from '@components/people/PersonRow';
import { useConnections, type HydratedConnection } from '@hooks/useConnections';
import { useCurrentUser } from '@hooks/useCurrentUser';
import type { PeopleStackParamList } from '@navigation/types';
import { acceptConnection, declineConnection, cancelSentRequest } from '@utils/connections';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const sectionHeaderStyle =
  'px-4 pb-2 text-[13px] font-semibold uppercase tracking-[0.3px] text-brand-text-secondary';
const primaryBtnStyle = tva({
  base: 'rounded-lg bg-brand-primary px-[14px] py-[7px]',
  variants: { disabled: { true: 'opacity-50' } },
});
const iconBtnStyle = tva({
  base: 'h-8 w-8 items-center justify-center rounded-full bg-typography-50',
  variants: { disabled: { true: 'opacity-50' } },
});

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
      <Box className="flex-1 bg-brand-surface-subtle">
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            testID="person-row-skeleton"
            className="mx-4 my-1.5 h-14 rounded-lg bg-brand-divider"
          />
        ))}
      </Box>
    );
  }

  const isEmpty =
    pendingIncoming.length === 0 && accepted.length === 0 && pendingOutgoing.length === 0;

  if (isEmpty) {
    return (
      <Box className="flex-1 items-center justify-center gap-2 p-6">
        <Text className="text-lg font-semibold text-brand-text">No connections yet</Text>
        <Text className="mb-4 text-sm text-brand-text-secondary">
          Tap + to find people you know.
        </Text>
        <Pressable
          className="rounded-xl bg-brand-primary px-6 py-3"
          onPress={() => navigation.navigate('AddConnection')}
        >
          <Text className="font-semibold text-typography-white">Add People</Text>
        </Pressable>
      </Box>
    );
  }

  return (
    <ScrollView className="flex-1 bg-brand-surface-subtle" contentContainerClassName="py-3">
      {pendingIncoming.length > 0 && (
        <Box className="mb-4">
          <Text className={sectionHeaderStyle}>Requests ({pendingIncoming.length})</Text>
          {pendingIncoming.map((c) => (
            <PersonRow
              key={c.id}
              user={hydratedToUser(c)}
              trailing={
                <Box className="flex-row items-center gap-2">
                  <Pressable
                    className={primaryBtnStyle({ disabled: submittingId === c.id })}
                    disabled={submittingId === c.id}
                    onPress={() => {
                      void runMutation(c.id, acceptConnection);
                    }}
                  >
                    <Text className="text-[13px] font-semibold text-typography-white">Accept</Text>
                  </Pressable>
                  <Pressable
                    className={iconBtnStyle({ disabled: submittingId === c.id })}
                    disabled={submittingId === c.id}
                    accessibilityLabel="Decline"
                    onPress={() => {
                      void runMutation(c.id, declineConnection);
                    }}
                  >
                    <Text className="text-base text-brand-text-secondary">✕</Text>
                  </Pressable>
                </Box>
              }
            />
          ))}
        </Box>
      )}

      {accepted.length > 0 && (
        <Box className="mb-4">
          <Text className={sectionHeaderStyle}>Connected ({accepted.length})</Text>
          {accepted.map((c) => (
            <PersonRow
              key={c.id}
              user={hydratedToUser(c)}
              trailing={<Text className="text-base text-brand-text-muted">›</Text>}
              onPress={() => navigation.navigate('PersonProfile', { userId: c.other_user_id })}
            />
          ))}
        </Box>
      )}

      {pendingOutgoing.length > 0 && (
        <Box className="mb-4">
          <Pressable onPress={toggleSent} className="flex-row items-center justify-between pr-4">
            <Text className={sectionHeaderStyle}>Sent ({pendingOutgoing.length})</Text>
            <Text className="text-base text-brand-text-muted">{sentExpanded ? '▾' : '▸'}</Text>
          </Pressable>
          {sentExpanded &&
            pendingOutgoing.map((c) => (
              <PersonRow
                key={c.id}
                user={hydratedToUser(c)}
                trailing={
                  <Box className="flex-row items-center gap-2">
                    <Text className="text-[13px] text-brand-text-muted">Pending</Text>
                    <Pressable
                      className={iconBtnStyle({ disabled: submittingId === c.id })}
                      disabled={submittingId === c.id}
                      accessibilityLabel="Cancel"
                      onPress={() => {
                        void runMutation(c.id, cancelSentRequest);
                      }}
                    >
                      <Text className="text-base text-brand-text-secondary">✕</Text>
                    </Pressable>
                  </Box>
                }
              />
            ))}
        </Box>
      )}

      {submittingId && (
        <Box className="mt-4">
          <ActivityIndicator size="small" />
        </Box>
      )}
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
