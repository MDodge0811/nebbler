import { getAvatarColor, getInitials } from '@utils/avatarColor';

describe('getAvatarColor', () => {
  it('returns a hex color string', () => {
    const color = getAvatarColor('abc-123');
    expect(color).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('is deterministic — same ID returns same color', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    expect(getAvatarColor(id)).toBe(getAvatarColor(id));
  });

  it('returns a color for an empty string', () => {
    const color = getAvatarColor('');
    expect(color).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('can produce different colors for different IDs', () => {
    const colors = new Set(['user-1', 'user-2', 'user-3', 'user-4', 'user-5'].map(getAvatarColor));
    expect(colors.size).toBeGreaterThan(1);
  });
});

describe('getInitials', () => {
  it('returns two initials from first and last name', () => {
    expect(getInitials('Alice', 'Smith')).toBe('AS');
  });

  it('returns one initial when only first name is provided', () => {
    expect(getInitials('Alice', null)).toBe('A');
  });

  it('returns one initial when only last name is provided', () => {
    expect(getInitials(null, 'Smith')).toBe('S');
  });

  it('falls back to first character of fallback string', () => {
    expect(getInitials(null, null, 'alice@example.com')).toBe('A');
  });

  it('returns ? when no data is available', () => {
    expect(getInitials(null, null)).toBe('?');
    expect(getInitials(undefined, undefined, '')).toBe('?');
  });

  it('uppercases initials', () => {
    expect(getInitials('alice', 'smith')).toBe('AS');
  });

  it('trims whitespace from names', () => {
    expect(getInitials('  alice  ', '  smith  ')).toBe('AS');
  });

  it('handles empty strings as missing', () => {
    expect(getInitials('', '', 'bob@test.com')).toBe('B');
  });
});
