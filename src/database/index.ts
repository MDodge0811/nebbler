// Database initialization and instance
export { initializeDatabase, connectDatabase, getDatabase, disconnectDatabase } from './database';

// Schema and types
export { AppSchema } from './schema';
export type { Database } from './schema';

// Connector
export { PowerSyncConnector } from './connector';
export type { PowerSyncCredentials } from './connector';
