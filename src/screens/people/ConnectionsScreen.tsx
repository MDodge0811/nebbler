import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { PersonRow } from '@components/people/PersonRow';
import { SectionHeader } from '@components/people/SectionHeader';
import { AvatarCircle } from '@components/ui/AvatarCircle';
import type { ConnectionRequestItem } from '@database/schemas';
import {
  useConnections,
  useSharedCalendarCounts,
  type HydratedConnection,
} from '@hooks/useConnections';
import { useConnectionRequests, useResolveRequest } from '@hooks/useConnectionsApi';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { useOnlineAction } from '@hooks/useOnlineAction';
import type { PeopleStackParamList } from '@navigation/types';
import { displayName } from '@utils/displayName';

type Nav = NativeStackNavigationProp<PeopleStackParamList, 'Connections'>;
type ResolveStatus = 'accepted' | 'declined' | 'cancelled';

export function ConnectionsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { show } = useToast();
  const { user } = useCurrentUser();
  const currentUserId = user?.id;

  const { connections, isLoading } = useConnections(currentUserId);
  const sharedCounts = useSharedCalendarCounts(currentUserId);
  const { data: requests, refetch } = useConnectionRequests();
  const resolve = useOnlineAction(useResolveRequest());

  const [search, setSearch] = useState('');
  const [sentOpen, setSentOpen] = useState(false);

  // Poll-on-open: refetch pending requests whenever the screen regains focus.
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const incoming = requests?.incoming ?? [];
  const outgoing = requests?.outgoing ?? [];
  const filtered = filterConnections(connections, search);
  const actionsDisabled = resolve.isPending || !resolve.isConnected;

  const onResolve = (id: string, status: ResolveStatus) => {
    void resolve.run({ id, status }).then((result) => {
      if (result.status !== 'success') {
        show({ id: `resolve-${id}`, placement: 'top', title: result.message });
      }
    });
  };

  const goToProfile = (userId: string) => navigation.navigate('PersonProfile', { userId });
  const goToAdd = () => navigation.navigate('AddConnection');

  return (
    <Box className="flex-1 bg-brand-surface-subtle">
      <DynamicColorView paddingTop={insets.top}>
        <Box className="flex-row items-center justify-between px-4 pb-3 pt-2">
          <Text className="text-[28px] font-extrabold tracking-[-0.5px] text-brand-text">
            People
          </Text>
          <Pressable
            onPress={goToAdd}
            accessibilityRole="button"
            accessibilityLabel="Add connection"
            className="h-9 w-9 items-center justify-center rounded-full border border-brand-border bg-brand-surface-muted"
          >
            <PersonPlusIcon />
          </Pressable>
        </Box>
      </DynamicColorView>

      <SearchBar value={search} onChange={setSearch} />

      <ScrollView contentContainerClassName="pb-8" keyboardShouldPersistTaps="handled">
        <PendingRequestsCard
          incoming={incoming}
          disabled={actionsDisabled}
          connected={resolve.isConnected}
          onResolve={onResolve}
        />

        <SectionHeader label="Your Connections" count={filtered.length} />
        <ConnectedList
          isLoading={isLoading}
          connections={filtered}
          sharedCounts={sharedCounts}
          search={search}
          onOpen={goToProfile}
          onAdd={goToAdd}
        />

        <SentRequestsSection
          outgoing={outgoing}
          open={sentOpen}
          onToggle={() => setSentOpen((v) => !v)}
          disabled={actionsDisabled}
          onResolve={onResolve}
        />
      </ScrollView>
    </Box>
  );
}

function filterConnections(
  connections: HydratedConnection[],
  search: string
): HydratedConnection[] {
  const q = search.trim().toLowerCase();
  if (!q) return connections;
  return connections.filter((c) => {
    const name = displayName({
      id: c.other_user_id,
      first_name: c.first_name,
      last_name: c.last_name,
      email: null,
    }).toLowerCase();
    return name.includes(q) || (c.username?.toLowerCase().includes(q) ?? false);
  });
}

/** `@username · N shared` second line for a connected row. */
function connectedSubtitle(username: string | null, shared: number): string | null {
  const handle = username ? `@${username}` : null;
  const sharedLabel = shared > 0 ? `${shared} shared` : null;
  return [handle, sharedLabel].filter(Boolean).join(' · ') || null;
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

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Box className="px-4 pb-2">
      <Box className="flex-row items-center gap-2 rounded-xl border-[1.5px] border-brand-border bg-background-0 px-3.5 py-2.5">
        <Text className="text-brand-text-muted">⌕</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Search connections…"
          placeholderTextColor="#9B9BA8"
          className="flex-1 text-sm text-brand-text"
        />
        {value.length > 0 && (
          <Pressable accessibilityLabel="Clear search" onPress={() => onChange('')}>
            <Text className="px-1 text-brand-text-secondary">✕</Text>
          </Pressable>
        )}
      </Box>
    </Box>
  );
}

function PendingRequestsCard({
  incoming,
  disabled,
  connected,
  onResolve,
}: {
  incoming: ConnectionRequestItem[];
  disabled: boolean;
  connected: boolean;
  onResolve: (id: string, status: ResolveStatus) => void;
}) {
  if (incoming.length === 0) return null;
  return (
    <Box className="mx-3 mb-2 mt-1 overflow-hidden rounded-[14px] border border-brand-primary-border bg-brand-primary-light">
      <SectionHeader label="Pending Requests" badge={incoming.length} />
      {!connected && (
        <Text className="px-4 pb-1 text-xs text-brand-text-muted">
          You're offline — reconnect to respond.
        </Text>
      )}
      {incoming.map((item) => (
        <PendingRequestRow
          key={item.id}
          item={item}
          disabled={disabled}
          onAccept={() => onResolve(item.id, 'accepted')}
          onDecline={() => onResolve(item.id, 'declined')}
        />
      ))}
    </Box>
  );
}

function ConnectedList({
  isLoading,
  connections,
  sharedCounts,
  search,
  onOpen,
  onAdd,
}: {
  isLoading: boolean;
  connections: HydratedConnection[];
  sharedCounts: Record<string, number>;
  search: string;
  onOpen: (userId: string) => void;
  onAdd: () => void;
}) {
  if (isLoading) {
    return (
      <Box className="mx-3">
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            testID="person-row-skeleton"
            className="my-1.5 h-14 rounded-lg bg-brand-divider"
          />
        ))}
      </Box>
    );
  }
  if (connections.length === 0) {
    return <ConnectionsEmptyState search={search} onAdd={onAdd} />;
  }
  return (
    <Box className="mx-3 overflow-hidden rounded-[14px] border border-brand-border bg-background-0">
      {connections.map((c, i) => (
        <Box key={c.id}>
          <PersonRow
            user={hydratedToUser(c)}
            subtitle={connectedSubtitle(c.username, sharedCounts[c.other_user_id] ?? 0)}
            trailing={<Text className="text-base text-brand-text-muted">›</Text>}
            onPress={() => onOpen(c.other_user_id)}
          />
          {i < connections.length - 1 && <Box className="ml-[70px] h-px bg-brand-divider" />}
        </Box>
      ))}
    </Box>
  );
}

function SentRequestsSection({
  outgoing,
  open,
  onToggle,
  disabled,
  onResolve,
}: {
  outgoing: ConnectionRequestItem[];
  open: boolean;
  onToggle: () => void;
  disabled: boolean;
  onResolve: (id: string, status: ResolveStatus) => void;
}) {
  if (outgoing.length === 0) return null;
  return (
    <Box className="mt-1">
      <SectionHeader
        label="Sent Requests"
        count={outgoing.length}
        collapsible
        open={open}
        onToggle={onToggle}
      />
      {open && (
        <Box className="mx-3 overflow-hidden rounded-[14px] border border-brand-border bg-background-0">
          {outgoing.map((item, i) => (
            <Box key={item.id}>
              <SentRequestRow
                item={item}
                disabled={disabled}
                onCancel={() => onResolve(item.id, 'cancelled')}
              />
              {i < outgoing.length - 1 && <Box className="ml-[66px] h-px bg-brand-divider" />}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function PendingRequestRow({
  item,
  disabled,
  onAccept,
  onDecline,
}: {
  item: ConnectionRequestItem;
  disabled: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const name = displayName({ ...item.user, email: null });
  return (
    <Box className="flex-row items-center gap-3 px-4 py-3">
      <AvatarCircle user={item.user} size={40} />
      <Box className="flex-1">
        <Text numberOfLines={1} className="text-[15px] font-medium text-brand-text">
          {name}
        </Text>
        <Text numberOfLines={1} className="mt-px text-[13px] text-brand-text-muted">
          {item.user.username ? `@${item.user.username} · ` : ''}— mutual
        </Text>
      </Box>
      <Box className="flex-row gap-2">
        <Pressable
          onPress={onDecline}
          disabled={disabled}
          accessibilityRole="button"
          className={`rounded-[10px] border border-brand-border bg-brand-surface-muted px-3.5 py-[7px] ${
            disabled ? 'opacity-50' : ''
          }`}
        >
          <Text className="text-[13px] font-semibold text-brand-text-secondary">Decline</Text>
        </Pressable>
        <Pressable
          onPress={onAccept}
          disabled={disabled}
          accessibilityRole="button"
          className={`rounded-[10px] bg-brand-primary px-3.5 py-[7px] ${disabled ? 'opacity-50' : ''}`}
        >
          <Text className="text-[13px] font-semibold text-typography-white">Accept</Text>
        </Pressable>
      </Box>
    </Box>
  );
}

function SentRequestRow({
  item,
  disabled,
  onCancel,
}: {
  item: ConnectionRequestItem;
  disabled: boolean;
  onCancel: () => void;
}) {
  const name = displayName({ ...item.user, email: null });
  return (
    <Box className="flex-row items-center gap-3 px-4 py-2.5">
      <AvatarCircle user={item.user} size={32} />
      <Box className="flex-1">
        <Box className="flex-row items-center gap-2">
          <Text numberOfLines={1} className="text-sm font-medium text-brand-text">
            {name}
          </Text>
          <Box className="rounded-md bg-brand-surface-muted px-2 py-0.5">
            <Text className="text-[11px] font-semibold tracking-[0.2px] text-brand-text-muted">
              Pending
            </Text>
          </Box>
        </Box>
        {item.user.username && (
          <Text numberOfLines={1} className="mt-px text-xs text-brand-text-muted">
            @{item.user.username}
          </Text>
        )}
      </Box>
      <Pressable
        onPress={onCancel}
        disabled={disabled}
        accessibilityRole="button"
        className={`rounded-lg border border-brand-border px-3 py-[5px] ${disabled ? 'opacity-50' : ''}`}
      >
        <Text className="text-xs font-medium text-brand-text-muted">Cancel</Text>
      </Pressable>
    </Box>
  );
}

function ConnectionsEmptyState({ search, onAdd }: { search: string; onAdd: () => void }) {
  if (search.trim().length > 0) {
    return (
      <Box className="mx-3 items-center rounded-[14px] border border-brand-border bg-background-0 p-8">
        <Text className="text-sm text-brand-text-muted">No connections matching "{search}"</Text>
      </Box>
    );
  }
  return (
    <Box className="mx-3 items-center gap-1.5 rounded-[14px] border border-brand-border bg-background-0 px-5 py-8">
      <Text className="text-2xl">👋</Text>
      <Text className="text-base font-semibold text-brand-text">No connections yet</Text>
      <Text className="mb-3 text-center text-sm text-brand-text-muted">
        Connect with people to share calendars and find times to meet.
      </Text>
      <Pressable className="rounded-xl bg-brand-primary px-5 py-2.5" onPress={onAdd}>
        <Text className="text-sm font-semibold text-typography-white">Find People</Text>
      </Pressable>
    </Box>
  );
}

function PersonPlusIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx="8" cy="6" r="3.5" stroke="#00DB74" strokeWidth="1.5" />
      <Path
        d="M1.5 17C1.5 13.5 4.5 11.5 8 11.5C9.5 11.5 10.8 11.9 11.8 12.5"
        stroke="#00DB74"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path d="M16 12V18M13 15H19" stroke="#00DB74" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}
