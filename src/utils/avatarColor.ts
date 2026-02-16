const AVATAR_COLORS = [
  '#FF6B6B',
  '#00DB74',
  '#00B0DB',
  '#FF8C42',
  '#A855F7',
  '#EC4899',
  '#14B8A6',
  '#F59E0B',
];

/**
 * Returns a deterministic background color for a user avatar based on their ID.
 * The same userId always produces the same color.
 */
export function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = hash + userId.charCodeAt(i);
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/**
 * Extracts up to 2 uppercase initials from a user's name.
 * Falls back to the first character of `fallback` (email or username) if names are empty.
 */
export function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  fallback?: string
): string {
  const first = firstName?.trim()?.[0];
  const last = lastName?.trim()?.[0];

  if (first && last) return `${first}${last}`.toUpperCase();
  if (first) return first.toUpperCase();
  if (last) return last.toUpperCase();

  const fallbackChar = fallback?.trim()?.[0];
  return fallbackChar ? fallbackChar.toUpperCase() : '?';
}
