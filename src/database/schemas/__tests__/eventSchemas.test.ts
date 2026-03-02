import { CreateEventSchema } from '../eventSchemas';

const validData = {
  title: 'Team Standup',
  calendarId: 'cal-123',
  startTime: new Date('2026-03-02T13:00:00Z'),
  endTime: new Date('2026-03-02T14:00:00Z'),
};

describe('CreateEventSchema', () => {
  it('accepts valid event data', () => {
    const result = CreateEventSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts optional description', () => {
    const result = CreateEventSchema.safeParse({ ...validData, description: 'Weekly sync' });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = CreateEventSchema.safeParse({ ...validData, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty calendarId', () => {
    const result = CreateEventSchema.safeParse({ ...validData, calendarId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects end time equal to start time', () => {
    const same = new Date('2026-03-02T13:00:00Z');
    const result = CreateEventSchema.safeParse({ ...validData, startTime: same, endTime: same });
    expect(result.success).toBe(false);
  });

  it('rejects end time before start time', () => {
    const result = CreateEventSchema.safeParse({
      ...validData,
      startTime: new Date('2026-03-02T14:00:00Z'),
      endTime: new Date('2026-03-02T13:00:00Z'),
    });
    expect(result.success).toBe(false);
  });
});
