// Sync status hooks
export { useSyncStatus, useHasPendingChanges } from './useSyncStatus';
export type { SyncState, SyncStatusInfo } from './useSyncStatus';

// Auth hooks. These are the ONLY adapters over the identity provider —
// screens must not import `@clerk/*` directly (enforced in eslint.config.js).
// `useAuth` reads session/identity; the *Flow hooks drive sign-in/sign-up/OAuth.
export { useAuth } from './useAuth';
export { useSignInFlow, useSignUpFlow, useOAuthSignIn } from './useAuthFlows';
export type { PasswordSignInResult, RegisterParams } from './useAuthFlows';

// User hooks
export { useCurrentUser, useCurrentUserMutations } from './useCurrentUser';

// Calendar hooks
export { useEvents, useMarkedDates, useEventMutations } from './useCalendarEvents';
export { useCalendars, useCalendar, useCalendarMutations } from './useCalendars';
export {
  useCalendarMembers,
  useCalendarMemberMutations,
  useCalendarMemberUserIds,
} from './useCalendarMembers';
export {
  useCalendarGroups,
  useCalendarGroup,
  useCalendarGroupMemberships,
  useCalendarGroupMutations,
} from './useCalendarGroups';

// Calendar detail hook
export { useCalendarDetail } from './useCalendarDetail';
export type { CalendarDetailMember, CalendarDetailPermissions } from './useCalendarDetail';

// Event response hooks
export { useEventResponses, useEventResponseMutations } from './useEventResponses';

// Connection hooks (People tab)
export {
  useConnections,
  useConnectionWith,
  useSharedCalendarCount,
  useSharedCalendarCounts,
  useSharedCalendars,
  useUserProfile,
} from './useConnections';
export type { HydratedConnection } from './useConnections';
export { useDebouncedValue } from './useDebouncedValue';

// Connection REST hooks (TanStack Query — online-only). `useUserProfileApi` is
// the online REST profile fetch, distinct from the PowerSync-backed
// `useUserProfile` (offline synced read) re-exported from `./useConnections`.
export {
  connectionsKeys,
  useConnectionRequests,
  useUserProfileApi,
  useSendRequest,
  useResolveRequest,
  useRemoveConnection,
  useBlockUser,
} from './useConnectionsApi';

// Online-required mutation UX primitive (FE-3).
export { useOnlineAction } from './useOnlineAction';
export type { OnlineActionResult } from './useOnlineAction';

// Online user search (FE-5 — TanStack standard).
export { useUserSearch } from './useUserSearch';

// Event stars (NEB-177)
export { useEventStars } from './useEventStars';
