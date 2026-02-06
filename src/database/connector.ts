import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  UpdateType,
} from '@powersync/react-native';
import { powersyncConfig } from '@constants/config';

/**
 * Credentials returned from the backend authentication endpoint
 */
export interface PowerSyncCredentials {
  endpoint: string;
  token: string;
  expiresAt?: Date;
}

/**
 * PowerSyncConnector implements the backend communication layer
 *
 * Two main responsibilities:
 * 1. fetchCredentials(): Get JWT token for PowerSync authentication
 * 2. uploadData(): Send local changes to the backend for processing
 */
export class PowerSyncConnector implements PowerSyncBackendConnector {
  /**
   * Fetch authentication credentials from your backend
   *
   * The backend should:
   * 1. Authenticate the user (using your auth system)
   * 2. Generate a JWT token with PowerSync claims
   * 3. Return the token and PowerSync endpoint URL
   *
   * JWT must include:
   * - sub: user ID
   * - iat: issued at timestamp
   * - exp: expiration timestamp
   * - Signed with your PowerSync instance's private key
   */
  async fetchCredentials(): Promise<PowerSyncCredentials> {
    // TODO: Replace with actual authentication logic
    // This should call your backend auth endpoint

    const response = await fetch(`${powersyncConfig.backendUrl}/api/powersync/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include your app's authentication header
        // 'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      endpoint: powersyncConfig.powersyncUrl,
      token: data.token,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    };
  }

  /**
   * Upload local changes to the backend
   *
   * Called automatically when there are pending local changes
   * The backend should:
   * 1. Validate the changes
   * 2. Apply them to Postgres
   * 3. Return success (changes will sync back via PowerSync)
   *
   * @param database - PowerSync database instance for reading pending changes
   */
  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    // Get the next batch of changes to upload
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) {
      return; // No changes to upload
    }

    try {
      // Process each change in the transaction
      for (const operation of transaction.crud) {
        await this.uploadCrudEntry(operation);
      }

      // Mark transaction as complete (removes from upload queue)
      await transaction.complete();
    } catch (error) {
      // Transaction will be retried on next sync
      console.error('Upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload a single CRUD operation to the backend
   */
  private async uploadCrudEntry(entry: CrudEntry): Promise<void> {
    const { op, table, id, opData } = entry;

    // Map PowerSync operation types to HTTP methods
    const methodMap: Record<UpdateType, string> = {
      [UpdateType.PUT]: 'PUT',
      [UpdateType.PATCH]: 'PATCH',
      [UpdateType.DELETE]: 'DELETE',
    };

    const response = await fetch(`${powersyncConfig.backendUrl}/api/data/${table}/${id}`, {
      method: methodMap[op],
      headers: {
        'Content-Type': 'application/json',
        // Include your app's authentication header
        // 'Authorization': `Bearer ${userToken}`,
      },
      body: op !== UpdateType.DELETE ? JSON.stringify(opData) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Upload failed for ${table}/${id}: ${response.status}`);
    }
  }
}
