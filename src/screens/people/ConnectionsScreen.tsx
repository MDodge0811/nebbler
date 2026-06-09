import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { PersonRow } from '@components/people/PersonRow';
import { useConnections, type HydratedConnection } from '@hooks/useConnections';
import { useCurrentUser } from '@hooks/useCurrentUser';
import type { PeopleStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<PeopleStackParamList, 'Connections'>;

const sectionHeaderStyle =
  'px-4 pb-2 text-[13px] font-semibold uppercase tracking-[0.3px] text-brand-text-secondary';

export function ConnectionsScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useCurrentUser();
  const { connections, isLoading } = useConnections(user?.id);

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

  if (connections.length === 0) {
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
      <Box className="mb-4">
        <Text className={sectionHeaderStyle}>Connected ({connections.length})</Text>
        {connections.map((c) => (
          <PersonRow
            key={c.id}
            user={hydratedToUser(c)}
            trailing={<Text className="text-base text-brand-text-muted">›</Text>}
            onPress={() => navigation.navigate('PersonProfile', { userId: c.other_user_id })}
          />
        ))}
      </Box>
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
