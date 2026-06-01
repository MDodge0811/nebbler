import {
  type AbstractPowerSyncDatabase,
  type CrudEntry,
  type PowerSyncBackendConnector,
  UpdateType,
} from '@powersync/react-native';

import { powersyncConfig } from '@constants/config';
import { FetchCredentialsResponseSchema } from '@database/schemas';

/**
 * Credentials returned from Clerk's JWT template endpoint.
 */
export interface PowerSyncCredentials {
  endpoint: string;
  token: string;
  expiresAt?: Date;
}

/**
 * Returns a Clerk-signed JWT. Two templates are used:
 *   - `'powersync'` (template name in Clerk) for PowerSync auth
 *   - `undefined` / default template for our backend API
 *
 * Pulled from `useAuth().getToken` (`@clerk/clerk-expo`) and set at module
 * level by the `ClerkPowerSyncBridge` mounted under `<ClerkProvider>`.
 */
export type ClerkTokenGetter = (opts?: { template?: string }) => Promise<string | null>;

let clerkGetToken: ClerkTokenGetter | null = null;

export function setClerkTokenGetter(getter: ClerkTokenGetter): void {
  clerkGetToken = getter;
}

export function clearClerkTokenGetter(): void {
  clerkGetToken = null;
}

async function getApiToken(): Promise<string | null> {
  if (!clerkGetToken) return null;
  return clerkGetToken();
}

async function getPowerSyncToken(): Promise<string | null> {
  if (!clerkGetToken) return null;
  return clerkGetToken({ template: 'powersync' });
}

/**
 * fetchCredentials() runs on a PowerSync retry loop, so naively logging on
 * every failure floods the console. Track the last surfaced error so we
 * only emit the loud message when something *new* breaks.
 */
let lastFetchCredentialsError: string | null = null;

/**
 * Loudly surface configuration mistakes that otherwise present as a silent
 * "Connected: No" with no other evidence. The most common cause by far is
 * a missing `powersync` JWT template in the Clerk dashboard — Clerk throws
 * an opaque "Template not found" which PowerSync's SDK then catches and
 * retries forever, so the user sees nothing.
 */
function logPowerSyncCredentialFailure(short: string, err: unknown): void {
  const detail = err instanceof Error ? err.message : err == null ? '' : String(err);
  const key = `${short}::${detail}`;
  if (lastFetchCredentialsError === key) return;
  lastFetchCredentialsError = key;

  console.error(
    [
      `[PowerSync] fetchCredentials failed: ${short}`,
      detail ? `  Underlying error: ${detail}` : null,
      `  Most likely cause: the 'powersync' JWT template is missing from Clerk.`,
      `  Fix in the Clerk dashboard:`,
      `    1. Configure → Sessions → JWT templates → New template`,
      `    2. Name (exact, lowercase): powersync`,
      `    3. Custom claims:`,
      `       { "aud": "powersync", "user_id": "{{user.public_metadata.internal_user_id}}" }`,
      `    4. Save, then sign out + sign in in the app.`,
      `  Docs: https://clerk.com/docs/guides/sessions/jwt-templates`,
    ]
      .filter((line): line is string => line !== null)
      .join('\n')
  );
}

/**
 * PowerSyncConnector implements the backend communication layer.
 *
 * Two responsibilities:
 * 1. `fetchCredentials()` — return a Clerk-issued PowerSync JWT (no backend hop).
 * 2. `uploadData()` — POST local changes to our Phoenix API with a Clerk session JWT.
 */
export class PowerSyncConnector implements PowerSyncBackendConnector {
  /**
   * Mint a PowerSync JWT directly from Clerk using the `powersync` template.
   *
   * The template embeds our internal user UUID as a custom `user_id` claim
   * (sourced from `user.publicMetadata.internal_user_id`, written by the
   * Clerk webhook handler on user.created). Sync rules read this claim.
   */
  async fetchCredentials(): Promise<PowerSyncCredentials> {
    let token: string | null;

    try {
      token = await getPowerSyncToken();
    } catch (err) {
      // Most likely culprit when getToken throws here: the `powersync` JWT
      // template does not exist in the Clerk dashboard.
      logPowerSyncCredentialFailure("Clerk getToken({ template: 'powersync' }) threw", err);
      throw err;
    }

    if (!token) {
      // `clerkGetToken === null` means there's no session yet — quiet path,
      // ClerkPowerSyncBridge hasn't installed the getter. This is expected
      // pre-sign-in and shouldn't spam the console.
      if (!clerkGetToken) {
        throw new Error('[PowerSync] No Clerk session — cannot fetch PowerSync token');
      }

      // Getter exists but returned null. That usually means the template
      // exists but has no claims / can't be issued for this user — surface
      // it loudly.
      logPowerSyncCredentialFailure(
        "Clerk getToken({ template: 'powersync' }) returned null",
        null
      );
      throw new Error('[PowerSync] Clerk returned a null PowerSync token');
    }

    // Reset the dedupe key on a successful credential fetch so a *new* failure
    // after a streak of healthy fetches will print, not be silently swallowed.
    lastFetchCredentialsError = null;

    // Pre-flight validation: confirm token shape matches expectations.
    const parsed = FetchCredentialsResponseSchema.parse({ token });

    return {
      endpoint: powersyncConfig.powersyncUrl,
      token: parsed.token,
    };
  }

  /**
   * Upload local changes to the backend.
   *
   * Called automatically when there are pending local changes. The backend
   * validates and persists; PowerSync replicates the change back to all
   * other clients via logical replication.
   */
  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) {
      return;
    }

    try {
      for (const operation of transaction.crud) {
        await this.uploadCrudEntry(operation);
      }

      await transaction.complete();
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload a single CRUD operation. Error classification:
   * - 4xx → permanent (validation, not found, conflict) — skip
   * - 5xx → transient — throw so PowerSync retries
   */
  private async uploadCrudEntry(entry: CrudEntry): Promise<void> {
    const { op, table, id, opData } = entry;

    const methodMap: Record<UpdateType, string> = {
      [UpdateType.PUT]: 'PUT',
      [UpdateType.PATCH]: 'PATCH',
      [UpdateType.DELETE]: 'DELETE',
    };

    const authToken = await getApiToken();
    if (!authToken) {
      // User signed out mid-upload; ClerkPowerSyncBridge will disconnect shortly.
      return;
    }
    const response = await fetch(`${powersyncConfig.backendUrl}/api/data/${table}/${id}`, {
      method: methodMap[op],
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      ...(op !== UpdateType.DELETE ? { body: JSON.stringify(opData) } : {}),
    });

    if (!response.ok) {
      if (response.status >= 400 && response.status < 500) {
        console.error(
          `[PowerSync] Permanent upload failure for ${table}/${id}: ${response.status} — skipping`
        );
        return;
      }
      throw new Error(`Upload failed for ${table}/${id}: ${response.status}`);
    }
  }
}
