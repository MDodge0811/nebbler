// Set __DEV__ global for tests (matches Expo development behavior)
global.__DEV__ = true;

// Mock native modules that cannot be loaded in Jest
jest.mock('@op-engineering/op-sqlite', () => ({}));
jest.mock('@powersync/op-sqlite', () => ({
  OPSqliteOpenFactory: jest.fn(),
}));
