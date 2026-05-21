import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
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
    const token = await getPowerSyncToken();

    if (!token) {
      throw new Error('[PowerSync] No Clerk session — cannot fetch PowerSync token');
    }

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
      body: op !== UpdateType.DELETE ? JSON.stringify(opData) : undefined,
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
