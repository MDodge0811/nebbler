import { getApiToken } from '@database/index';
import { searchUsers, RateLimitedError } from '@utils/userSearch';

// Mock the database module so getApiToken is controllable. jest.mock is hoisted
// above these imports, so getApiToken resolves to the mock at runtime.
jest.mock('@database/index', () => ({
  getApiToken: jest.fn(),
}));

// Mock expo-constants (used indirectly by config.ts)
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: { extra: { apiPort: '4000', powersyncPort: '8080' } },
  },
}));

const mockGetApiToken = getApiToken as jest.MockedFunction<typeof getApiToken>;

let fetchSpy: jest.SpyInstance;

describe('searchUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApiToken.mockResolvedValue('test-token');
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(jest.fn());
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('returns [] without calling fetch when query is shorter than 2 chars', async () => {
    await expect(searchUsers('')).resolves.toEqual([]);
    await expect(searchUsers(' ')).resolves.toEqual([]);
    await expect(searchUsers('a')).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns parsed results on a 200 response', async () => {
    const mockUser = {
      id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
      first_name: 'Alice',
      last_name: 'Smith',
      avatar_color: '#00DB74',
    };
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([mockUser]),
    });

    const result = await searchUsers('alice');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: mockUser.id, first_name: 'Alice' });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/search?q=alice'),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      })
    );
  });

  it('throws RateLimitedError on 429, with retryAfterSeconds from body', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 429,
      json: jest.fn().mockResolvedValue({ retry_after_seconds: 30 }),
    });

    await expect(searchUsers('alice')).rejects.toThrow(RateLimitedError);
    await expect(searchUsers('alice')).rejects.toMatchObject({ retryAfterSeconds: 30 });
  });

  it('returns [] on 400 response', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({ error: 'bad request' }),
    });

    await expect(searchUsers('al')).resolves.toEqual([]);
  });

  it('throws a generic Error on other non-2xx responses', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({}),
    });

    await expect(searchUsers('alice')).rejects.toThrow(/500/);
  });

  it('throws when no auth token is available', async () => {
    mockGetApiToken.mockResolvedValue(null);

    await expect(searchUsers('alice')).rejects.toThrow(/not signed in/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
