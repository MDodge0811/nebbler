type DisplayNameUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

const warnedUserIds = new Set<string>();

/**
 * Renders a user's display name per the People-tab convention:
 * - first_name + ' ' + last_name when present (either alone if the other is null)
 * - email local-part as fallback (plus a one-time console.warn flagging the data-quality issue)
 * - 'Unknown' as last resort
 *
 * See AGENTS.md > "People-tab name handling".
 */
export function displayName(user: DisplayNameUser): string {
  const first = user.first_name?.trim();
  const last = user.last_name?.trim();

  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;

  if (user.email) {
    if (!warnedUserIds.has(user.id)) {
      warnedUserIds.add(user.id);
      console.warn(
        `[data-quality] user ${user.id} has null first_name and last_name; falling back to email local-part`
      );
    }
    return user.email.split('@')[0] ?? user.email;
  }

  return 'Unknown';
}

/** Test-only — reset the warned-user-id cache between tests. */
export function __resetDisplayNameWarnings(): void {
  warnedUserIds.clear();
}
