import { displayName, __resetDisplayNameWarnings } from '../displayName';

describe('displayName', () => {
  beforeEach(() => {
    __resetDisplayNameWarnings();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.warn as jest.Mock).mockRestore();
  });

  it('returns full name when both first and last are present', () => {
    expect(
      displayName({ id: 'u1', first_name: 'Sarah', last_name: 'Chen', email: 's@x.com' })
    ).toBe('Sarah Chen');
  });

  it('returns only first name when last name is null', () => {
    expect(displayName({ id: 'u1', first_name: 'Sarah', last_name: null, email: 's@x.com' })).toBe(
      'Sarah'
    );
  });

  it('returns only last name when first name is null', () => {
    expect(displayName({ id: 'u1', first_name: null, last_name: 'Chen', email: 's@x.com' })).toBe(
      'Chen'
    );
  });

  it('falls back to email local-part when both names are null', () => {
    expect(
      displayName({ id: 'u1', first_name: null, last_name: null, email: 'sarah@example.com' })
    ).toBe('sarah');
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('emits only one warning per user id across repeated calls', () => {
    displayName({ id: 'u1', first_name: null, last_name: null, email: 'a@x.com' });
    displayName({ id: 'u1', first_name: null, last_name: null, email: 'a@x.com' });
    displayName({ id: 'u1', first_name: null, last_name: null, email: 'a@x.com' });
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('warns separately for different user ids', () => {
    displayName({ id: 'u1', first_name: null, last_name: null, email: 'a@x.com' });
    displayName({ id: 'u2', first_name: null, last_name: null, email: 'b@x.com' });
    expect(console.warn).toHaveBeenCalledTimes(2);
  });

  it('returns "Unknown" when names and email are all missing', () => {
    expect(displayName({ id: 'u1', first_name: null, last_name: null, email: null })).toBe(
      'Unknown'
    );
  });

  it('trims whitespace in names', () => {
    expect(
      displayName({ id: 'u1', first_name: '  Sarah  ', last_name: '  Chen  ', email: null })
    ).toBe('Sarah Chen');
  });
});
