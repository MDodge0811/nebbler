import {
  sendRequest,
  listRequests,
  resolveRequest,
  removeConnection,
  getUserProfile,
  blockUser,
  connectionErrorMessage,
  NotAuthenticatedError,
  InboundRequestExistsError,
  AlreadyConnectedError,
  OutboundRequestExistsError,
  RequestNotPendingError,
  ValidationError,
  ForbiddenError,
  NotFoundError,
  ConnectionsApiError,
} from '@api/connections';
import { getApiToken } from '@database/index';

jest.mock('@database/index', () => ({ getApiToken: jest.fn() }));
jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { apiPort: '4000', powersyncPort: '8080' } } },
}));

const mockGetApiToken = getApiToken as jest.MockedFunction<typeof getApiToken>;
let fetchSpy: jest.SpyInstance;

const errorBody = (code: string, message = 'err', details?: unknown) => ({
  ok: false,
  json: jest.fn().mockResolvedValue({ error: { code, message, details } }),
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetApiToken.mockResolvedValue('test-token');
  fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(jest.fn());
});
afterEach(() => fetchSpy.mockRestore());

describe('auth', () => {
  it('throws NotAuthenticatedError and never fetches when no token', async () => {
    mockGetApiToken.mockResolvedValue(null);
    await expect(sendRequest('id')).rejects.toThrow(NotAuthenticatedError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('sendRequest', () => {
  it('POSTs requestee_id with bearer token and returns created request on 201', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue({
        connection_request: {
          id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          status: 'pending',
          direction: 'outgoing',
          other_user_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          requestor_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
          requestee_id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
          completed_at: null,
          inserted_at: '2026-06-09T00:00:00Z',
        },
      }),
    });
    const res = await sendRequest('dddddddd-dddd-4ddd-8ddd-dddddddddddd');
    expect(res.id).toBe('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
    expect(res.status).toBe('pending');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/connection-requests'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ requestee_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' }),
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      })
    );
  });

  it('throws InboundRequestExistsError on 409 inbound_request_exists', async () => {
    fetchSpy.mockResolvedValue({ status: 409, ...errorBody('inbound_request_exists') });
    await expect(sendRequest('id')).rejects.toThrow(InboundRequestExistsError);
  });
  it('throws AlreadyConnectedError on 409 already_connected', async () => {
    fetchSpy.mockResolvedValue({ status: 409, ...errorBody('already_connected') });
    await expect(sendRequest('id')).rejects.toThrow(AlreadyConnectedError);
  });
  it('throws OutboundRequestExistsError on 409 outbound_request_exists', async () => {
    fetchSpy.mockResolvedValue({ status: 409, ...errorBody('outbound_request_exists') });
    await expect(sendRequest('id')).rejects.toThrow(OutboundRequestExistsError);
  });
  it('throws ValidationError with details on 422', async () => {
    fetchSpy.mockResolvedValue({
      status: 422,
      ...errorBody('validation_failed', 'bad', { requestee_id: ['is invalid'] }),
    });
    await expect(sendRequest('id')).rejects.toThrow(ValidationError);
    await expect(sendRequest('id')).rejects.toMatchObject({
      name: 'ValidationError',
      details: { requestee_id: ['is invalid'] },
    });
  });
});

describe('listRequests', () => {
  it('GETs and parses incoming/outgoing', async () => {
    const user = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      username: 'alice',
      first_name: 'Alice',
      last_name: 'Smith',
      avatar_color: '#00DB74',
    };
    fetchSpy.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        incoming: [
          {
            id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            user,
            requested_at: '2026-06-09T00:00:00Z',
          },
        ],
        outgoing: [],
      }),
    });
    const res = await listRequests();
    expect(res.incoming).toHaveLength(1);
    expect(res.outgoing).toHaveLength(0);
  });
  it('throws NotFoundError on 404', async () => {
    fetchSpy.mockResolvedValue({ status: 404, ...errorBody('not_found') });
    await expect(listRequests()).rejects.toThrow(NotFoundError);
  });
});

describe('resolveRequest', () => {
  it.each(['accepted', 'declined', 'cancelled'] as const)('PATCHes status=%s', async (status) => {
    fetchSpy.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({}) });
    await expect(resolveRequest('req-id', status)).resolves.toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/connection-requests/req-id'),
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status }) })
    );
  });
  it('throws ForbiddenError on 403 (wrong actor)', async () => {
    fetchSpy.mockResolvedValue({ status: 403, ...errorBody('forbidden') });
    await expect(resolveRequest('req-id', 'accepted')).rejects.toThrow(ForbiddenError);
  });
  it('throws RequestNotPendingError on 409 not_pending', async () => {
    fetchSpy.mockResolvedValue({ status: 409, ...errorBody('not_pending') });
    await expect(resolveRequest('req-id', 'accepted')).rejects.toThrow(RequestNotPendingError);
  });
});

describe('removeConnection', () => {
  it('PATCHes /api/connections/:id with bearer token', async () => {
    fetchSpy.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ status: 'ok' }) });
    await expect(removeConnection('conn-id')).resolves.toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/connections/conn-id'),
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      })
    );
  });
  it('throws ForbiddenError on 403 (non-participant)', async () => {
    fetchSpy.mockResolvedValue({ status: 403, ...errorBody('forbidden') });
    await expect(removeConnection('conn-id')).rejects.toThrow(ForbiddenError);
  });
  it('throws NotFoundError on 404', async () => {
    fetchSpy.mockResolvedValue({ status: 404, ...errorBody('not_found') });
    await expect(removeConnection('conn-id')).rejects.toThrow(NotFoundError);
  });
  it('throws NotAuthenticatedError when no token', async () => {
    mockGetApiToken.mockResolvedValue(null);
    await expect(removeConnection('conn-id')).rejects.toThrow(NotAuthenticatedError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('getUserProfile', () => {
  const profile = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    username: 'alice',
    first_name: 'Alice',
    last_name: 'Smith',
    avatar_color: '#00DB74',
    relationship: {
      state: 'connected',
      request_id: null,
      connection_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    },
  };
  it('GETs /api/users/:id and parses the profile', async () => {
    fetchSpy.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(profile) });
    const res = await getUserProfile(profile.id);
    expect(res.username).toBe('alice');
    expect(res.relationship.state).toBe('connected');
  });
  it('throws NotFoundError on 404', async () => {
    fetchSpy.mockResolvedValue({ status: 404, ...errorBody('not_found') });
    await expect(getUserProfile('missing')).rejects.toThrow(NotFoundError);
  });
});

describe('blockUser', () => {
  it('POSTs blockee_id and resolves on 201 (newly created)', async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 201, json: jest.fn().mockResolvedValue({}) });
    await expect(blockUser('blockee-id')).resolves.toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/blocks'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ blockee_id: 'blockee-id' }),
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      })
    );
  });
  it('resolves on 200 (block already existed — idempotent)', async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 200, json: jest.fn().mockResolvedValue({}) });
    await expect(blockUser('blockee-id')).resolves.toBeUndefined();
  });
  it('throws ValidationError on 422 self_block', async () => {
    fetchSpy.mockResolvedValue({
      status: 422,
      ...errorBody('self_block', 'Cannot block yourself'),
    });
    await expect(blockUser('me')).rejects.toThrow(ValidationError);
  });
  it('throws NotAuthenticatedError when no token', async () => {
    mockGetApiToken.mockResolvedValue(null);
    await expect(blockUser('blockee-id')).rejects.toThrow(NotAuthenticatedError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('connectionErrorMessage', () => {
  it('maps known typed errors to friendly copy', () => {
    expect(connectionErrorMessage(new InboundRequestExistsError())).toMatch(/accept it instead/i);
    expect(connectionErrorMessage(new AlreadyConnectedError())).toMatch(/already connected/i);
    expect(connectionErrorMessage(new OutboundRequestExistsError())).toMatch(/pending request/i);
    expect(connectionErrorMessage(new RequestNotPendingError())).toMatch(/already handled/i);
    expect(connectionErrorMessage(new ForbiddenError())).toMatch(/not allowed/i);
    expect(connectionErrorMessage(new NotFoundError())).toMatch(/no longer available/i);
    expect(connectionErrorMessage(new NotAuthenticatedError())).toMatch(/sign in/i);
  });
  it('falls back to a network message for unknown/non-api errors', () => {
    expect(connectionErrorMessage(new Error('boom'))).toMatch(/reach the server/i);
    expect(connectionErrorMessage('weird')).toMatch(/reach the server/i);
  });
});

describe('error mapping fallbacks', () => {
  it('maps a 401 response (token present but rejected) to NotAuthenticatedError', async () => {
    // distinct from the no-token short-circuit: here fetch DID run and the server returned 401
    fetchSpy.mockResolvedValue({ status: 401, ...errorBody('unauthenticated') });
    await expect(listRequests()).rejects.toThrow(NotAuthenticatedError);
    expect(fetchSpy).toHaveBeenCalled();
  });
  it('maps an unknown 409 code to a generic ConnectionsApiError (BE-drift safety net)', async () => {
    fetchSpy.mockResolvedValue({ status: 409, ...errorBody('some_new_code') });
    await expect(sendRequest('id')).rejects.toMatchObject({
      name: 'ConnectionsApiError',
      status: 409,
      code: 'some_new_code',
    });
  });
  it('falls back to a status-only message when the error body is not JSON', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockRejectedValue(new Error('not json')),
    });
    await expect(sendRequest('id')).rejects.toMatchObject({
      status: 500,
      message: 'Request failed with status 500',
    });
  });
  it('maps an unhandled status to a generic ConnectionsApiError via the default case', async () => {
    fetchSpy.mockResolvedValue({ status: 503, ...errorBody('service_unavailable') });
    await expect(listRequests()).rejects.toMatchObject({
      name: 'ConnectionsApiError',
      status: 503,
    });
    await expect(listRequests()).rejects.toBeInstanceOf(ConnectionsApiError);
  });
});
