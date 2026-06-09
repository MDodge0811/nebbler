/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',
    '^@/components/ui/(.*)$': '<rootDir>/components/ui/$1',
    '^@/global\\.css$': '<rootDir>/__mocks__/styleMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@navigation/(.*)$': '<rootDir>/src/navigation/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1',
    '^@stores/(.*)$': '<rootDir>/src/stores/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@powersync/.*|@op-engineering/.*|nativewind|tailwind-variants|react-aria|react-stately|@react-aria/.*|@react-stately/.*|@legendapp/.*|@gluestack-ui/.*|@clerk/.*)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    // Coverage debt: hooks/utils with no (or effectively no) test coverage are
    // excluded so the per-file thresholds below can act as a real floor for the
    // files that ARE tested. New hooks/utils are gated by default (not on this
    // list). Remove an entry here once the file gets a test suite, then raise
    // its directory floor accordingly.
    '!src/hooks/useAuth.ts', // Clerk adapter, 0% — exercised only via mocks elsewhere
    '!src/hooks/useCalendarMembers.ts', // 0% — unused/WIP
    '!src/hooks/useEventDetail.ts', // 0%
    '!src/hooks/useEventResponses.ts', // 0% — unused/WIP
    '!src/hooks/useRoles.ts', // 0%
    '!src/hooks/useSyncStatus.ts', // 0%
    '!src/hooks/useWritableCalendars.ts', // 0%
    '!src/hooks/useCalendarEvents.ts', // ~30% — below floor, tracked debt
    '!src/hooks/useCalendars.ts', // ~33% — below floor, tracked debt
    '!src/utils/secureStorage.ts', // 0% — device storage adapter
  ],
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    'src/database/schemas/**': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Per-file floors (Jest applies glob thresholds per matching file, not to
    // the aggregate). Set below the lowest currently-tested file in each dir,
    // with margin for fluctuation. Untested/below-floor files are excluded via
    // collectCoverageFrom above. Ratchet these up as coverage debt is paid down.
    'src/hooks/**': {
      branches: 35,
      functions: 30,
      lines: 50,
      statements: 45,
    },
    'src/utils/**': {
      branches: 65,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testMatch: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.claude/worktrees/'],
  modulePathIgnorePatterns: ['<rootDir>/.claude/worktrees/'],
};
