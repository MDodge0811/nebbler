import { UpdateCalendarSchema } from '../updateCalendarSchema';

describe('UpdateCalendarSchema', () => {
  it('accepts a full valid payload', () => {
    const parsed = UpdateCalendarSchema.parse({
      name: 'Game Night',
      description: 'Weekly',
      color: '#A78BFA',
      rsvpEnabled: true,
      discoverable: false,
      affectsAvailability: true,
    });
    expect(parsed.name).toBe('Game Night');
  });

  it('rejects empty name', () => {
    expect(() => UpdateCalendarSchema.parse({ name: '' })).toThrow();
    expect(() => UpdateCalendarSchema.parse({ name: '   ' })).toThrow();
  });

  it('rejects name over 100 chars', () => {
    expect(() => UpdateCalendarSchema.parse({ name: 'x'.repeat(101) })).toThrow();
  });

  it('rejects bad color hex', () => {
    expect(() => UpdateCalendarSchema.parse({ name: 'x', color: 'not-a-color' })).toThrow();
  });

  it('rejects description over 500 chars', () => {
    expect(() => UpdateCalendarSchema.parse({ name: 'x', description: 'y'.repeat(501) })).toThrow();
  });

  it('accepts empty description string', () => {
    const parsed = UpdateCalendarSchema.parse({ name: 'x', description: '' });
    expect(parsed.description).toBe('');
  });
});
