/**
 * Runtime hex colors for props that can't be Tailwind classes — SVG stroke/fill,
 * Switch track/thumb, and `placeholderTextColor`. Static UI uses the `brand-*`
 * Tailwind tokens instead (see docs/superpowers/plans/2026-06-02-styling-token-map.md).
 */
export const calendarsUIColors = {
  primary: '#00DB74',
  border: '#E8E8EC',
  danger: '#FF6B6B',
  text: '#1A1A1F',
  textSecondary: '#6B6B78',
  textMuted: '#9B9BA8',
} as const;

export const UNGROUPED_DROP_ZONE_ID = '__ungrouped__' as const;

export const CALENDAR_PALETTE = [
  { name: 'Green', hex: '#00DB74' },
  { name: 'Blue', hex: '#00B0DB' },
  { name: 'Coral', hex: '#FF6B6B' },
  { name: 'Amber', hex: '#FFB347' },
  { name: 'Violet', hex: '#A78BFA' },
  { name: 'Pink', hex: '#F472B6' },
  { name: 'Mint', hex: '#34D399' },
  { name: 'Gold', hex: '#FBBF24' },
  { name: 'Sky', hex: '#60A5FA' },
  { name: 'Orange', hex: '#FB923C' },
  { name: 'Purple', hex: '#C084FC' },
  { name: 'Teal', hex: '#2DD4BF' },
] as const;
