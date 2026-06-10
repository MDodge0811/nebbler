import { powersyncConfig } from '@constants/config';
import { getApiToken } from '@database/index';
import {
  ApiErrorResponseSchema,
  ConnectionRequestEnvelopeSchema,
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
    super(401, 'unauthorized', message);
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

/** 409 — the current user already has an outstanding OUTGOING request to this user. */
export class OutboundRequestExistsError extends ConnectionsApiError {
  constructor(message = 'You already have a pending request to this user') {
    super(409, 'outbound_request_exists', message);
    this.name = 'OutboundRequestExistsError';
  }
}

/** 409 — the targeted request is no longer pending (already resolved). */
export class RequestNotPendingError extends ConnectionsApiError {
  constructor(message = 'This request is no longer pending') {
    super(409, 'not_pending', message);
    this.name = 'RequestNotPendingError';
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
 * Map a 409 conflict to its typed error by `error.code`. Codes verified against
 * the live BE: outbound_request_exists / inbound_request_exists /
 * already_connected / not_pending.
 */
function toConflictError(code: string, message: string): ConnectionsApiError {
  switch (code) {
    case 'inbound_request_exists':
      return new InboundRequestExistsError(message);
    case 'already_connected':
      return new AlreadyConnectedError(message);
    case 'outbound_request_exists':
      return new OutboundRequestExistsError(message);
    case 'not_pending':
      return new RequestNotPendingError(message);
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
    return ConnectionRequestEnvelopeSchema.parse(await response.json()).connection_request;
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
 * PATCH /api/connections/:id — remove/unfriend. Either participant may remove.
 * Server soft-deletes + cascades shared-calendar revocation; the row de-syncs.
 * Returns 200 { status: "ok" }. `:id` is the synced user_connections id (not
 * stable across remove → re-add).
 */
export async function removeConnection(connectionId: string): Promise<void> {
  const response = await authedFetch(`/api/connections/${connectionId}`, { method: 'PATCH' });
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

/**
 * POST /api/blocks — block a user (NEB-139). Server-side this severs any active
 * connection and cancels pending requests in one transaction; the connection row
 * then de-syncs from both devices. 201 when newly created, 200 when a block
 * already existed — both are success. The blockee is never notified. Errors:
 * `self_block`/`invalid_blockee` (422), 401.
 */
export async function blockUser(blockeeId: string): Promise<void> {
  const response = await authedFetch('/api/blocks', {
    method: 'POST',
    body: JSON.stringify({ blockee_id: blockeeId }),
  });
  if (response.ok) return;
  throw await toTypedError(response);
}

/**
 * Map a connections error (or any thrown value) to user-facing toast copy. Lives
 * in the api layer so every hook/screen shares one mapping — the hook layer can't
 * import the toast component, so screens own the surface but reuse this text.
 */
export function connectionErrorMessage(error: unknown): string {
  if (error instanceof NotAuthenticatedError) return 'Please sign in again to continue.';
  if (error instanceof ForbiddenError) return "You're not allowed to do that.";
  if (error instanceof NotFoundError) return "That's no longer available.";
  if (error instanceof InboundRequestExistsError)
    return 'They already sent you a request — accept it instead.';
  if (error instanceof AlreadyConnectedError) return "You're already connected.";
  if (error instanceof OutboundRequestExistsError) return 'You already have a pending request.';
  if (error instanceof RequestNotPendingError) return 'That request was already handled.';
  if (error instanceof ValidationError) return error.message || "That didn't work — try again.";
  if (error instanceof ConnectionsApiError) return error.message || 'Something went wrong.';
  return "Couldn't reach the server. Check your connection.";
}
