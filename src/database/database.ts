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
 * Initialize and return the PowerSync database instance
 *
 * This function:
 * 1. Creates the SQLite database using op-sqlite adapter
 * 2. Initializes PowerSync with the schema
 * 3. Connects to the backend and starts syncing
 *
 * Call this once during app initialization
 */
export async function initializeDatabase(): Promise<PowerSyncDatabase> {
  if (powerSyncInstance) {
    return powerSyncInstance;
  }

  // Create the database factory using op-sqlite (New Architecture compatible)
  const factory = new OPSqliteOpenFactory({
    dbFilename: DATABASE_NAME,
  });

  // Create the PowerSync database instance
  powerSyncInstance = new PowerSyncDatabase({
    schema: AppSchema,
    database: factory,
  });

  // Initialize the database (creates tables based on schema)
  await powerSyncInstance.init();

  // Create and set the backend connector
  const connector = new PowerSyncConnector();

  // Connect to PowerSync and start syncing
  // This authenticates and begins the sync stream
  await powerSyncInstance.connect(connector);

  console.log('PowerSync database initialized and connected');

  return powerSyncInstance;
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
    powerSyncInstance = null;
    console.log('PowerSync database disconnected');
  }
}

/**
 * Export the database instance for direct access
 * Prefer using getDatabase() for safety
 */
export { powerSyncInstance };
