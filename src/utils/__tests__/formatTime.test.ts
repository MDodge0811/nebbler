import { formatTimeRange, formatTimeShort, formatSectionDate } from '@utils/formatTime';

describe('formatTimeRange', () => {
  it('formats a time range with AM/PM', () => {
    const result = formatTimeRange('2026-02-24T14:00:00Z', '2026-02-24T16:00:00Z');
    // Exact output depends on timezone, but should contain AM/PM markers
    expect(result).toContain('–');
    expect(result).toMatch(/[AP]M/);
  });

  it('handles same start and end time', () => {
    const result = formatTimeRange('2026-02-24T09:00:00Z', '2026-02-24T09:00:00Z');
    expect(result).toContain('–');
  });
});

describe('formatTimeShort', () => {
  it('formats a single time with AM/PM', () => {
    const result = formatTimeShort('2026-02-24T14:00:00Z');
    expect(result).toMatch(/[AP]M/);
  });

  it('returns a non-empty string', () => {
    const result = formatTimeShort('2026-02-24T09:30:00Z');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatSectionDate', () => {
  it('prefixes with "Today" when date matches today', () => {
    const result = formatSectionDate('2026-02-24', '2026-02-24');
    expect(result).toMatch(/^Today, /);
    expect(result).toContain('Feb');
    expect(result).toContain('24');
  });

  it('shows weekday with comma for non-today dates', () => {
    const result = formatSectionDate('2026-02-25', '2026-02-24');
    expect(result).not.toContain('Today');
    expect(result).toContain('Wednesday');
    expect(result).toContain('Feb');
    expect(result).toContain('25');
  });

  it('shows correct weekday for a known date', () => {
    // Feb 24, 2026 is a Tuesday
    const result = formatSectionDate('2026-02-24', '2026-01-01');
    expect(result).toContain('Tuesday');
  });
});
