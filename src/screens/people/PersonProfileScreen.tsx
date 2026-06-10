import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { AvatarCircle } from '@components/ui/AvatarCircle';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import type { Relationship } from '@database/schemas';
import {
  useConnectionWith,
  useSharedCalendars,
  useSharedCalendarCount,
  useUserProfile,
} from '@hooks/useConnections';
import {
  useBlockUser,
  useRemoveConnection,
  useResolveRequest,
  useSendRequest,
  useUserProfileApi,
} from '@hooks/useConnectionsApi';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { useOnlineAction, type OnlineActionResult } from '@hooks/useOnlineAction';
import type { PeopleStackParamList, RootStackParamList } from '@navigation/types';
import { displayName } from '@utils/displayName';
import { relationshipToAction, type RelationshipAction } from '@utils/relationship';

type ScreenRoute = RouteProp<PeopleStackParamList, 'PersonProfile'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;
type Runner<TVars> = {
  run: (v: TVars) => Promise<OnlineActionResult>;
  isPending: boolean;
  isConnected: boolean;
};

type BasicUser = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_color: string | null;
};

export function PersonProfileScreen() {
  const route = useRoute<ScreenRoute>();
  const navigation = useNavigation<Nav>();
  const { show } = useToast();
  const { user: me } = useCurrentUser();
  const currentUserId = me?.id;
  const userId = route.params.userId;

  const connection = useConnectionWith(currentUserId, userId);
  const isConnected = connection !== null;
  const syncedUser = useUserProfile(userId);
  const apiQuery = useUserProfileApi(isConnected ? undefined : userId);
  const sharedCalendars = useSharedCalendars(currentUserId, userId);
  const sharedCount = useSharedCalendarCount(currentUserId, userId);

  const remove = useOnlineAction(useRemoveConnection());
  const block = useOnlineAction(useBlockUser());
  const send = useOnlineAction(useSendRequest());
  const respond = useOnlineAction(useResolveRequest());

  const basic: BasicUser | null = isConnected ? syncedUser : (apiQuery.data ?? null);
  const name = basic ? displayName({ ...basic, email: null }) : '';
  const toast = (id: string, title: string) => show({ id, placement: 'top', title });

  useLayoutEffect(() => {
    navigation.setOptions({ title: name });
  }, [navigation, name]);

  // Removed/blocked while viewing: a once-connected profile whose row vanished
  // from sync (no status flip — detect by absence) pops back to the list.
  const wasConnected = useRef(isConnected);
  useEffect(() => {
    if (wasConnected.current && !isConnected) navigation.goBack();
    wasConnected.current = isConnected;
  }, [isConnected, navigation]);

  if (!basic) {
    return <ProfileFallback loading={!isConnected && apiQuery.isLoading} />;
  }

  return (
    <ScrollView className="flex-1 bg-brand-surface-subtle" contentContainerClassName="py-3 pb-8">
      <ProfileCard
        basic={basic}
        name={name}
        isConnected={isConnected}
        sharedCount={sharedCount}
        since={connection?.inserted_at}
      />

      {isConnected ? (
        <ConnectedBody
          name={name}
          connectionId={connection.id}
          blockeeId={userId}
          sharedCalendars={sharedCalendars}
          remove={remove}
          block={block}
          toast={toast}
          onOpenCalendar={(calendarId) => navigation.navigate('CalendarDetail', { calendarId })}
          onFindTime={() => toast('find-a-time-coming-soon', 'Find a Time is coming soon.')}
        />
      ) : (
        <NonConnectedActions
          relationship={apiQuery.data?.relationship}
          unavailable={apiQuery.isError}
          send={send}
          respond={respond}
          userId={userId}
          toast={toast}
          onResolved={() => void apiQuery.refetch()}
        />
      )}
    </ScrollView>
  );
}

function ProfileFallback({ loading }: { loading: boolean }) {
  return (
    <Box className="flex-1 items-center justify-center bg-brand-surface-subtle p-6">
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text className="text-base text-brand-text-secondary">This person isn't available.</Text>
      )}
    </Box>
  );
}

function ProfileCard({
  basic,
  name,
  isConnected,
  sharedCount,
  since,
}: {
  basic: BasicUser;
  name: string;
  isConnected: boolean;
  sharedCount: number;
  since: string | undefined;
}) {
  return (
    <Box className="m-3 items-center rounded-2xl border border-brand-border bg-background-0 px-5 pb-6 pt-7">
      <AvatarCircle user={basic} size={80} />
      <Text className="mt-4 text-[22px] font-bold tracking-[-0.3px] text-brand-text">{name}</Text>
      {basic.username && (
        <Text className="mt-1 text-sm text-brand-text-muted">@{basic.username}</Text>
      )}
      <StatusPill connected={isConnected} />
      {isConnected && (
        <Box className="mt-4 w-full flex-row items-stretch justify-center border-t border-brand-divider pt-3">
          <Stat value="—" label="Mutual" />
          <Box className="w-px bg-brand-divider" />
          <Stat value={String(sharedCount)} label="Shared" />
          <Box className="w-px bg-brand-divider" />
          <Stat value={formatSince(since)} label="Since" small />
        </Box>
      )}
    </Box>
  );
}

function Stat({ value, label, small }: { value: string; label: string; small?: boolean }) {
  return (
    <Box className="flex-1 items-center">
      <Text
        className={small ? 'text-xs text-brand-text-muted' : 'text-base font-bold text-brand-text'}
      >
        {value}
      </Text>
      <Text className="mt-0.5 text-xs text-brand-text-muted">{label}</Text>
    </Box>
  );
}

function StatusPill({ connected }: { connected: boolean }) {
  if (!connected) {
    return <Text className="mt-3 text-[13px] text-brand-text-muted">Not connected</Text>;
  }
  return (
    <Box className="mt-3 flex-row items-center gap-1.5 rounded-[20px] border border-brand-primary-border bg-brand-primary-light px-[14px] py-[5px]">
      <Box className="h-[7px] w-[7px] rounded-full bg-brand-primary" />
      <Text className="text-[13px] font-semibold text-brand-primary">Connected</Text>
    </Box>
  );
}

function ConnectedBody({
  name,
  connectionId,
  blockeeId,
  sharedCalendars,
  remove,
  block,
  toast,
  onOpenCalendar,
  onFindTime,
}: {
  name: string;
  connectionId: string;
  blockeeId: string;
  sharedCalendars: { id: string; name: string; color: string | null }[];
  remove: Runner<string>;
  block: Runner<string>;
  toast: (id: string, title: string) => void;
  onOpenCalendar: (calendarId: string) => void;
  onFindTime: () => void;
}) {
  const [dialog, setDialog] = useState<null | 'remove' | 'block'>(null);
  const disabled = remove.isPending || block.isPending || !remove.isConnected;

  const onRemove = () => {
    void remove.run(connectionId).then((r) => {
      setDialog(null);
      if (r.status !== 'success') toast('remove-error', r.message);
    });
  };
  const onBlock = () => {
    void block.run(blockeeId).then((r) => {
      setDialog(null);
      if (r.status !== 'success') toast('block-error', r.message);
    });
  };

  return (
    <>
      <Pressable
        className="m-3 flex-row items-center justify-center gap-2.5 rounded-[14px] bg-brand-primary py-3.5"
        onPress={onFindTime}
      >
        <ClockIcon />
        <Text className="text-base font-bold text-typography-white">Find a Time</Text>
      </Pressable>

      <Text className={sectionLabel}>SHARED CALENDARS</Text>
      <Box className={sectionCard}>
        {sharedCalendars.length > 0 ? (
          sharedCalendars.map((cal, i) => (
            <SharedCalendarRow
              key={cal.id}
              calendar={cal}
              isLast={i === sharedCalendars.length - 1}
              onPress={() => onOpenCalendar(cal.id)}
            />
          ))
        ) : (
          <Text className="p-5 text-center text-sm text-brand-text-muted">
            You don't share any calendars with {name} yet.
          </Text>
        )}
      </Box>

      <Text className={sectionLabel}>CONNECTION</Text>
      <Box className={sectionCard}>
        <DangerRow
          label="Remove Connection"
          hint="Also removes from shared calendars"
          disabled={disabled}
          onPress={() => setDialog('remove')}
          icon={<RemoveIcon />}
        />
        <Box className="ml-11 h-px bg-brand-divider" />
        <DangerRow
          label="Block"
          hint="Prevents all future interaction"
          disabled={disabled}
          onPress={() => setDialog('block')}
          icon={<BlockIcon />}
        />
      </Box>

      <ConfirmDialog
        visible={dialog === 'remove'}
        title="Remove Connection?"
        message={`Removing ${name} will also remove them from any shared calendars.`}
        confirmLabel="Remove"
        confirmDisabled={disabled}
        onConfirm={onRemove}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        visible={dialog === 'block'}
        title={`Block ${name}?`}
        message="This removes the connection and prevents all future interaction. They won't be notified."
        confirmLabel="Block"
        confirmDisabled={disabled}
        onConfirm={onBlock}
        onCancel={() => setDialog(null)}
      />
    </>
  );
}

function SharedCalendarRow({
  calendar,
  isLast,
  onPress,
}: {
  calendar: { id: string; name: string; color: string | null };
  isLast: boolean;
  onPress: () => void;
}) {
  const color = calendar.color ?? '#9B9BA8';
  return (
    <Box>
      <Pressable className="flex-row items-center gap-3 px-4 py-3" onPress={onPress}>
        <DynamicColorView
          className="h-9 w-9 rounded-[10px] border-[1.5px]"
          backgroundColor={`${color}15`}
          borderColor={`${color}30`}
        />
        <Text className="flex-1 text-[15px] font-medium text-brand-text">{calendar.name}</Text>
        <Text className="text-base text-brand-text-muted">›</Text>
      </Pressable>
      {!isLast && <Box className="ml-16 h-px bg-brand-divider" />}
    </Box>
  );
}

function DangerRow({
  label,
  hint,
  disabled,
  onPress,
  icon,
}: {
  label: string;
  hint: string;
  disabled: boolean;
  onPress: () => void;
  icon: ReactNode;
}) {
  return (
    <Pressable
      className={`flex-row items-center gap-3 px-4 py-3.5 ${disabled ? 'opacity-50' : ''}`}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Box className="w-4 items-center">{icon}</Box>
      <Box className="flex-1">
        <Text className="text-[15px] font-medium text-brand-danger">{label}</Text>
        <Text className="mt-0.5 text-xs text-brand-text-muted">{hint}</Text>
      </Box>
    </Pressable>
  );
}

function NonConnectedActions({
  relationship,
  unavailable,
  send,
  respond,
  userId,
  toast,
  onResolved,
}: {
  relationship: Relationship | undefined;
  unavailable: boolean;
  send: Runner<string>;
  respond: Runner<{ id: string; status: 'accepted' | 'declined' | 'cancelled' }>;
  userId: string;
  toast: (id: string, title: string) => void;
  onResolved: () => void;
}) {
  if (unavailable || !relationship) return null;
  const disabled = !send.isConnected || send.isPending || respond.isPending;
  const action: RelationshipAction = relationshipToAction(relationship);

  const onConnect = () => {
    void send.run(userId).then((r) => {
      if (r.status === 'success') onResolved();
      else if (r.status === 'error' && codeOf(r.error) === 'inbound_request_exists') {
        onResolved();
        toast('inbound', 'They already sent you a request — accept it.');
      } else toast('connect-error', r.message);
    });
  };
  const onAccept = (requestId: string) => {
    void respond.run({ id: requestId, status: 'accepted' }).then((r) => {
      if (r.status !== 'success') toast('accept-error', r.message);
    });
  };

  if (action.kind === 'connect') {
    return <PrimaryAction label="Connect" disabled={disabled} onPress={onConnect} />;
  }
  if (action.kind === 'respond') {
    return (
      <PrimaryAction
        label="Accept Connection"
        disabled={disabled}
        onPress={() => onAccept(action.requestId)}
      />
    );
  }
  if (action.kind === 'cancel') {
    return (
      <Box className="m-3 items-center rounded-[14px] border border-brand-border bg-background-0 py-3.5">
        <Text className="text-[15px] font-semibold text-brand-text-muted">Request Pending</Text>
      </Box>
    );
  }
  return null;
}

function PrimaryAction({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`m-3 items-center rounded-[14px] bg-brand-primary py-3.5 ${disabled ? 'opacity-50' : ''}`}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text className="text-base font-bold text-typography-white">{label}</Text>
    </Pressable>
  );
}

function codeOf(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'code' in err) return String(err.code);
  return undefined;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatSince(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const sectionLabel =
  'px-4 pb-1.5 pt-2 text-[13px] font-semibold tracking-[0.3px] text-brand-text-muted';
const sectionCard =
  'mx-3 mb-3 overflow-hidden rounded-[14px] border border-brand-border bg-background-0';

function ClockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Circle cx="9" cy="9" r="7" stroke="#fff" strokeWidth="1.5" />
      <Path
        d="M9 5V9L12 11"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RemoveIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path d="M4 8H12" stroke="#FF6B6B" strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="8" cy="8" r="6" stroke="#FF6B6B" strokeWidth="1.5" />
    </Svg>
  );
}

function BlockIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Circle cx="8" cy="8" r="6" stroke="#FF6B6B" strokeWidth="1.5" />
      <Path d="M3.8 3.8L12.2 12.2" stroke="#FF6B6B" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}
