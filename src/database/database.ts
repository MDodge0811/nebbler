import { OPSqliteOpenFactory } from '@powersync/op-sqlite';
import { PowerSyncDatabase } from '@powersync/react-native';

import { PowerSyncConnector } from './connector';
import { AppSchema } from './schema';

const DATABASE_NAME = 'nebbler.sqlite';

let powerSyncInstance: PowerSyncDatabase | null = null;

/**
 * Initialize the PowerSync database (schema + local tables only).
 *
 * Does NOT connect to the backend — call `connectDatabase()` after the
 * user has authenticated AND `setClerkTokenGetter` has been called so the
 * connector can request tokens from Clerk.
 */
export async function initializeDatabase(): Promise<PowerSyncDatabase> {
  if (powerSyncInstance) {
    return powerSyncInstance;
  }

  const factory = new OPSqliteOpenFactory({
    dbFilename: DATABASE_NAME,
  });

  powerSyncInstance = new PowerSyncDatabase({
    schema: AppSchema,
    database: factory,
  });

  await powerSyncInstance.init();

  return powerSyncInstance;
}

/**
 * Connect PowerSync to the backend and start syncing.
 *
 * Call this once the user is signed in to Clerk. The connector reads
 * tokens via the module-level getter set by `setClerkTokenGetter`.
 */
export async function connectDatabase(): Promise<void> {
  if (!powerSyncInstance) {
    throw new Error('PowerSync database not initialized. Call initializeDatabase() first.');
  }

  const connector = new PowerSyncConnector();
  await powerSyncInstance.connect(connector);
}

export function getDatabase(): PowerSyncDatabase {
  if (!powerSyncInstance) {
    throw new Error('PowerSync database not initialized. Call initializeDatabase() first.');
  }
  return powerSyncInstance;
}

/**
 * Disconnect and clean up. Call during logout or app shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
  if (powerSyncInstance) {
    await powerSyncInstance.disconnect();
  }
}
