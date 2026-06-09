import { powersyncConfig } from '@constants/config';
import { getApiToken } from '@database/index';
import {
  ApiErrorResponseSchema,
  ConnectionRequestSchema,
  ConnectionRequestListResponseSchema,
  UserProfileResponseSchema,
  type ConnectionRequest,
  type ConnectionRequestListResponse,
  type UserProfileResponse,
} from '@database/schemas';

// ---------------------------------------------------------------------------
// Typed errors — mapped from the canonical NEB-147 envelope { error: { code, message, details? } }.
// ---------------------------------------------------------------------------

export class ConnectionsApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ConnectionsApiError';
    this.status = status;
    this.code = code;
  }
}

/** No auth token, or HTTP 401. */
export class NotAuthenticatedError extends ConnectionsApiError {
  constructor(message = 'User not signed in') {
    super(401, 'unauthenticated', message);
    this.name = 'NotAuthenticatedError';
  }
}

/** 403 — wrong actor for the transition, or non-participant on remove. */
export class ForbiddenError extends ConnectionsApiError {
  constructor(message = 'Forbidden') {
    super(403, 'forbidden', message);
    this.name = 'ForbiddenError';
  }
}

/** 404 — request/connection/user not found. */
export class NotFoundError extends ConnectionsApiError {
  constructor(message = 'Not found') {
    super(404, 'not_found', message);
    this.name = 'NotFoundError';
  }
}

/** 422 — self-connection or invalid/missing requestee. Carries field details. */
export class ValidationError extends ConnectionsApiError {
  details?: Record<string, string[]> | undefined;
  constructor(message = 'Validation failed', details?: Record<string, string[]>) {
    super(422, 'validation_failed', message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * 409 inbound_request_exists — the other user already sent YOU a pending
 * request. DISTINCT type: drives the FE-5 "Accept instead" handoff.
 */
export class InboundRequestExistsError extends ConnectionsApiError {
  constructor(message = 'This user has already sent you a request') {
    super(409, 'inbound_request_exists', message);
    this.name = 'InboundRequestExistsError';
  }
}

/** 409 — an active connection already exists. */
export class AlreadyConnectedError extends ConnectionsApiError {
  constructor(message = 'You are already connected') {
    super(409, 'already_connected', message);
    this.name = 'AlreadyConnectedError';
  }
}

/** 409 — the current user already has an outstanding request to this user. */
export class DuplicateRequestError extends ConnectionsApiError {
  constructor(message = 'You already have a pending request to this user') {
    super(409, 'duplicate_request', message);
    this.name = 'DuplicateRequestError';
  }
}

// ---------------------------------------------------------------------------
// Shared core
// ---------------------------------------------------------------------------

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getApiToken();
  if (!token) throw new NotAuthenticatedError();
  return fetch(`${powersyncConfig.backendUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
}

/**
 * Map a 409 conflict to its typed error by `error.code`.
 * NOTE: the exact 409 `code` strings for already_connected / duplicate_request
 * are assumptions pending BE (NEB-138); inbound_request_exists is contractual.
 */
function toConflictError(code: string, message: string): ConnectionsApiError {
  switch (code) {
    case 'inbound_request_exists':
      return new InboundRequestExistsError(message);
    case 'already_connected':
      return new AlreadyConnectedError(message);
    case 'duplicate_request':
      return new DuplicateRequestError(message);
    default:
      return new ConnectionsApiError(409, code || 'conflict', message);
  }
}

/** Map a non-2xx response to a typed error using the canonical envelope. */
async function toTypedError(response: Response): Promise<ConnectionsApiError> {
  let code = '';
  let message = `Request failed with status ${response.status}`;
  let details: Record<string, string[]> | undefined;
  try {
    const parsed = ApiErrorResponseSchema.safeParse(await response.json());
    if (parsed.success) {
      code = parsed.data.error.code;
      message = parsed.data.error.message;
      details = parsed.data.error.details;
    }
  } catch {
    // non-JSON body — fall back to status-only mapping
  }

  switch (response.status) {
    case 401:
      return new NotAuthenticatedError(message);
    case 403:
      return new ForbiddenError(message);
    case 404:
      return new NotFoundError(message);
    case 422:
      return new ValidationError(message, details);
    case 409:
      return toConflictError(code, message);
    default:
      return new ConnectionsApiError(response.status, code || 'error', message);
  }
}

// ---------------------------------------------------------------------------
// connection-requests resource
// ---------------------------------------------------------------------------

/** POST /api/connection-requests — send a request. */
export async function sendRequest(requesteeId: string): Promise<ConnectionRequest> {
  const response = await authedFetch('/api/connection-requests', {
    method: 'POST',
    body: JSON.stringify({ requestee_id: requesteeId }),
  });
  if (response.status === 201) {
    return ConnectionRequestSchema.parse(await response.json());
  }
  throw await toTypedError(response);
}

/** GET /api/connection-requests — pending requests, split by direction. */
export async function listRequests(): Promise<ConnectionRequestListResponse> {
  const response = await authedFetch('/api/connection-requests', { method: 'GET' });
  if (response.ok) {
    return ConnectionRequestListResponseSchema.parse(await response.json());
  }
  throw await toTypedError(response);
}

export type ResolveStatus = 'accepted' | 'declined' | 'cancelled';

/** PATCH /api/connection-requests/:id — accept (requestee) / decline (requestee) / cancel (requestor). */
export async function resolveRequest(id: string, status: ResolveStatus): Promise<void> {
  const response = await authedFetch(`/api/connection-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (response.ok) return;
  throw await toTypedError(response);
}

// ---------------------------------------------------------------------------
// connections + users resources
// ---------------------------------------------------------------------------

/**
 * DELETE /api/connections/:id — remove/unfriend. Either participant may remove.
 * Server soft-deletes + cascades shared-calendar revocation; the row de-syncs.
 * `:id` is the synced user_connections id (not stable across remove → re-add).
 */
export async function removeConnection(connectionId: string): Promise<void> {
  const response = await authedFetch(`/api/connections/${connectionId}`, { method: 'DELETE' });
  if (response.ok) return;
  throw await toTypedError(response);
}

/** GET /api/users/:id — basic info + relationship. Never includes email. */
export async function getUserProfile(id: string): Promise<UserProfileResponse> {
  const response = await authedFetch(`/api/users/${id}`, { method: 'GET' });
  if (response.ok) {
    return UserProfileResponseSchema.parse(await response.json());
  }
  throw await toTypedError(response);
}
