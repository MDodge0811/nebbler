import { getCalendarColor } from '@utils/calendarColor';

describe('getCalendarColor', () => {
  it('returns a hex color string', () => {
    const color = getCalendarColor('cal-123');
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('is deterministic — same ID returns same color', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    expect(getCalendarColor(id)).toBe(getCalendarColor(id));
  });

  it('returns a color for an empty string', () => {
    const color = getCalendarColor('');
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('can produce different colors for different IDs', () => {
    const colors = new Set(['cal-1', 'cal-2', 'cal-3', 'cal-4', 'cal-5'].map(getCalendarColor));
    expect(colors.size).toBeGreaterThan(1);
  });
});
