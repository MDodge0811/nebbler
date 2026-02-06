// Database initialization and instance
export { initializeDatabase, getDatabase, disconnectDatabase } from './database';

// Schema and types
export { AppSchema } from './schema';
export type { Database, TestItem } from './schema';

// Connector
export { PowerSyncConnector } from './connector';
export type { PowerSyncCredentials } from './connector';
