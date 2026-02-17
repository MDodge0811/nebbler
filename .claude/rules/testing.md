---
paths:
  - '**/__tests__/**'
  - '*.test.ts'
  - '*.test.tsx'
  - 'jest.setup.js'
  - 'jest.config.js'
---

# Testing Rules

Jest + React Native Testing Library.

## Configuration

- Config: `jest.config.js`
- Preset: `jest-expo` (handles RN transforms, asset mocking, platform resolution)
- Setup file: `jest.setup.js` (sets `__DEV__ = true`, mocks native modules)
- Test location: `__tests__/` directories next to the code they test
- Test naming: `*.test.ts` or `*.test.tsx`

## Writing Tests

- **Pure logic** (schemas, utils, constants) — no mocking needed
- **Component tests** — use `@testing-library/react-native` (`render`, `screen`, `fireEvent`, `waitFor`)
- **Database/hook tests** — must mock `@powersync/react` and `@powersync/react-native`
- **Native modules** (`@op-engineering/op-sqlite`, `@powersync/op-sqlite`) are auto-mocked in `jest.setup.js`

## Adding New Native Module Mocks

Add `jest.mock('module-name', () => ({...}))` to `jest.setup.js`.

## Mock Gotchas (jest.setup.js)

- The `nativewind` mock must include `cssInterop: jest.fn()` — Gluestack UI components call `cssInterop()` at module load time
- `react-native-safe-area-context` and `react-native-gesture-handler` are mocked globally in `jest.setup.js`
- When testing components that use `useNavigation()`, mock `@react-navigation/native` in the test file — include `getParent()` if the component dispatches drawer actions
- Adding new Gluestack UI components via `npx gluestack-ui add <name>` may require adding new functions to the `nativewind` mock
