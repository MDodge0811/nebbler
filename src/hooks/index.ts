// Sync status hooks
export { useSyncStatus, useHasPendingChanges } from './useSyncStatus';
export type { SyncState, SyncStatusInfo } from './useSyncStatus';

// Auth hooks — for sign-in/sign-up flows use Clerk's hooks directly:
//   useSignIn, useSignUp, useSSO, useUser (from `@clerk/clerk-expo`).
export { useAuth } from './useAuth';

// User hooks
export { useCurrentUser } from './useCurrentUser';

// Calendar hooks
export {
  useCalendarEvents,
  useEvents,
  useMarkedDates,
  useEventMutations,
} from './useCalendarEvents';
export { useCalendars, useCalendar, useCalendarMutations } from './useCalendars';
export { useCalendarMembers, useCalendarMemberMutations } from './useCalendarMembers';
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
  useSharedCalendars,
  useUserProfile,
} from './useConnections';
export type { HydratedConnection } from './useConnections';
