// Set __DEV__ global for tests (matches Expo development behavior)
global.__DEV__ = true;

// Mock NativeWind (CSS-in-JS runtime not available in Jest)
jest.mock('nativewind', () => ({
  useColorScheme: () => ({ colorScheme: 'light', setColorScheme: jest.fn() }),
  vars: jest.fn((obj) => obj),
}));

// Mock expo-secure-store (native module not available in Jest)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock native modules that cannot be loaded in Jest
jest.mock('@op-engineering/op-sqlite', () => ({}));
jest.mock('@powersync/op-sqlite', () => ({
  OPSqliteOpenFactory: jest.fn(),
}));
