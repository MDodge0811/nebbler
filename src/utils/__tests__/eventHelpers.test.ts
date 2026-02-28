import { isAllDayEvent } from '../eventHelpers';

describe('isAllDayEvent', () => {
  it('returns true for midnight-to-midnight events (24h)', () => {
    expect(isAllDayEvent('2026-02-24T00:00:00Z', '2026-02-25T00:00:00Z')).toBe(true);
  });

  it('returns true for multi-day all-day events', () => {
    expect(isAllDayEvent('2026-02-24T00:00:00Z', '2026-02-26T00:00:00Z')).toBe(true);
  });

  it('returns false for events not starting at midnight', () => {
    expect(isAllDayEvent('2026-02-24T09:00:00Z', '2026-02-25T00:00:00Z')).toBe(false);
  });

  it('returns false for events not ending at midnight', () => {
    expect(isAllDayEvent('2026-02-24T00:00:00Z', '2026-02-24T17:00:00Z')).toBe(false);
  });

  it('returns false for short events', () => {
    expect(isAllDayEvent('2026-02-24T14:00:00Z', '2026-02-24T15:00:00Z')).toBe(false);
  });

  it('returns false when start_time is null', () => {
    expect(isAllDayEvent(null, '2026-02-25T00:00:00Z')).toBe(false);
  });

  it('returns false when end_time is null', () => {
    expect(isAllDayEvent('2026-02-24T00:00:00Z', null)).toBe(false);
  });

  it('returns false when both are null', () => {
    expect(isAllDayEvent(null, null)).toBe(false);
  });
});
