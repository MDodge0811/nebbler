import { PowerSyncDatabase } from '@powersync/react-native';
import { OPSqliteOpenFactory } from '@powersync/op-sqlite';
import { AppSchema } from './schema';
import { PowerSyncConnector } from './connector';

/**
 * Database filename for local storage
 * Stored in the app's documents directory
 */
const DATABASE_NAME = 'nebbler.sqlite';

/**
 * Singleton PowerSync database instance
 */
let powerSyncInstance: PowerSyncDatabase | null = null;

/**
 * Initialize the PowerSync database (schema + local tables only).
 *
 * Does NOT connect to the backend — call connectDatabase() after
 * the user has authenticated so sync requests carry a valid token.
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
 * Call this after the user authenticates so the connector
 * can include a valid Bearer token in requests.
 */
export async function connectDatabase(): Promise<void> {
  if (!powerSyncInstance) {
    throw new Error('PowerSync database not initialized. Call initializeDatabase() first.');
  }

  const connector = new PowerSyncConnector();
  await powerSyncInstance.connect(connector);
}

/**
 * Get the current database instance
 * Throws if database has not been initialized
 */
export function getDatabase(): PowerSyncDatabase {
  if (!powerSyncInstance) {
    throw new Error('PowerSync database not initialized. Call initializeDatabase() first.');
  }
  return powerSyncInstance;
}

/**
 * Disconnect and cleanup the database
 * Call during app shutdown or logout
 */
export async function disconnectDatabase(): Promise<void> {
  if (powerSyncInstance) {
    await powerSyncInstance.disconnect();
  }
}
