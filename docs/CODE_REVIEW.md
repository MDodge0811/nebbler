# Staff-Level Code Review: Nebbler

**Date:** 2025-02-11
**Reviewer:** Claude (automated staff-level review)
**Commit:** `e8813531` (main)

---

## Executive Summary

Nebbler has a solid foundation: strict TypeScript, Zod validation at trust boundaries, consistent tva() styling with Gluestack UI, type-safe navigation, and a clean hook-based data layer built on PowerSync. The architecture is well-organized with clear separation of concerns.

However, there are several issues that should be addressed before scaling further. Three are critical (a silent data-loss bug, dead code, and triple-duplicated logic), four are high priority (configuration inconsistencies that can cause build/test failures), and the rest are medium/low items around test coverage, error handling, and accessibility.

**Overall Grade: B+** -- Good architecture held back by dead code, config drift, and low test coverage.

---

## Critical Issues

### 1. Silent Data Loss: `password_hash` Accepted but Never Inserted

**File:** `src/hooks/useUsers.ts:15-41`

The `createUser` function accepts a `password_hash` parameter in its type signature but never includes it in the INSERT statement:

```ts
// Line 15-21: Function signature accepts password_hash
const createUser = async (attrs: {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  display_name?: string;
  password_hash: string; // <-- accepted
}) => {
  // Line 26-28: INSERT does not include password_hash
  await powerSync.execute(
    `INSERT INTO users (id, first_name, last_name, email, username, display_name, inserted_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    // password_hash silently dropped
  );
};
```

The schema comment at `src/database/schema.ts:32` says `password_hash` is intentionally excluded from sync (`// password_hash and deleted_at are excluded -- never synced to clients`), which is correct. But then the hook shouldn't accept it as a parameter at all -- the type signature is misleading and any caller would assume the value is being persisted.

**Fix:** Remove `password_hash` from the `createUser` parameter type, or document clearly why it's excluded. If the users table is meant to be read-only from the client, remove the mutation functions entirely.

---

### 2. Dead Code: `useUsers` Hook Defined but Never Used

**Files:**

- `src/hooks/useUsers.ts` -- 79 lines of fully implemented but unreachable code
- `src/hooks/index.ts` -- no export for `useUsers`, `useUser`, or `useUserMutations`

The entire `useUsers.ts` file (query hooks + CRUD mutations for the `users` table) is defined but never exported from the barrel file and never imported anywhere in the codebase. The `users` table exists in `src/database/schema.ts:26-35` and is included in `AppSchema`, but no UI ever reads from or writes to it.

**Fix:** Either export and use these hooks, or delete `useUsers.ts` and remove the `users` table from the schema if it's not needed on the client. Dead code creates maintenance burden and confusion about which tables are actively synced.

---

### 3. UUID Generation Duplicated Three Times

**Files:**

- `src/hooks/useTestItems.ts:79-85`
- `src/hooks/useUsers.ts:72-78`
- `src/services/authService.ts:38-44`

The exact same `generateUUID()` function is copy-pasted in three locations:

```ts
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
```

This violates DRY. If a bug is found or the implementation needs to change (e.g., switching to `crypto.randomUUID()` or the `uuid` package), it must be fixed in three places.

**Fix:** Extract to `src/utils/uuid.ts` and import everywhere.

---

## High Priority Issues

### 4. Path Alias Mismatch Across Build Systems

**Files:** `tsconfig.json:14-27`, `babel.config.js:13-28`, `jest.config.js:5-17`

The three systems that resolve path aliases use different formats:

| System     | Format        | Example                                               |
| ---------- | ------------- | ----------------------------------------------------- |
| TypeScript | Glob pattern  | `"@components/*": ["src/components/*"]`               |
| Babel      | Bare alias    | `'@components': './src/components'`                   |
| Jest       | Regex capture | `'^@components/(.*)$': '<rootDir>/src/components/$1'` |

This is technically functional today because each system's resolver handles its own format. But there are concrete discrepancies:

- **Babel has extra aliases** that don't exist in tsconfig or Jest: `'@/components/ui': './components/ui'` and `'@/global.css': './global.css'` (`babel.config.js:24-25`). These point to _root-level_ directories, not `src/`.
- **Babel puts `@` (the catch-all) after specific aliases** (`babel.config.js:26`), which works because module-resolver matches most-specific-first. But if the order changes, `@` would shadow the specific aliases.

**Risk:** Code that works at runtime (Babel) could fail in tests (Jest) if it relies on the Babel-only aliases.

**Fix:** Audit and document which aliases are intentionally Babel-only (for Gluestack UI components at `./components/ui/`) vs which should be universal.

---

### 5. `@/*` Path Falls Back to Project Root

**File:** `tsconfig.json:15`

```json
"@/*": ["src/*", "./*"],
```

The `@/*` alias resolves to `src/*` first, then falls back to `./*` (project root). This means `@/package.json`, `@/babel.config.js`, or `@/node_modules/...` are all valid TypeScript imports that will silently resolve.

**Risk:** Accidental imports from the root level that shouldn't be in app code. TypeScript won't flag them as errors.

**Fix:** Remove the `./*` fallback: `"@/*": ["src/*"]`. If specific root-level files need aliases (like `tailwind.config`), give them explicit entries (which already exists at `tsconfig.json:26`).

---

### 6. CSS Files Mapped to `jest.setup.js`

**File:** `jest.config.js:6`

```js
'\\.css$': '<rootDir>/jest.setup.js',
```

CSS imports are mapped to `jest.setup.js` itself -- a file that runs setup logic, mocks native modules, and sets `__DEV__`. This isn't a proper CSS mock. Standard practice is to map CSS to an empty module or a style mock:

```js
'\\.css$': '<rootDir>/__mocks__/styleMock.js',  // exports {}
```

**Risk:** If `jest.setup.js` exports anything unexpected, CSS imports in tests resolve to that value. Currently harmless because the setup file's `module.exports` is effectively empty (it runs side effects), but it's fragile and confusing.

**Fix:** Create a dedicated CSS mock file.

---

### 7. Mutation Hooks Don't Set `updated_at`

**Files:**

- `src/hooks/useTestItems.ts:37-57` (`updateItem`)
- `src/hooks/useUsers.ts:44-59` (`updateUser`)

Neither `updateItem` nor `updateUser` sets `updated_at` when modifying a record. The `createItem` function does set both `inserted_at` and `updated_at` on creation (`useTestItems.ts:30-31`), but subsequent updates leave `updated_at` stale.

Per `src/database/schema.ts:12-14`, the server overwrites timestamps on sync. But between the local write and the sync round-trip, the UI shows stale `updated_at` values. If any feature sorts or displays "last modified" time, it will be wrong.

**Fix:** Add `updated_at = ?` with `new Date().toISOString()` to all update operations.

---

## Medium Priority Issues

### 8. Test Coverage at ~9%

The only test files cover schemas and the mock auth service:

- `src/database/schemas/__tests__/authSchemas.test.ts`
- `src/database/schemas/__tests__/configSchema.test.ts`
- `src/services/__tests__/authService.test.ts`
- `src/constants/__tests__/theme.test.ts`

**Not tested:**

- All hooks (`useTestItems`, `useSyncStatus`, `useAuth`, `useAuthMutations`)
- All screens (`HomeScreen`, `LoginScreen`, `RegisterScreen`, `DetailsScreen`, `SettingsScreen`)
- All components (`SyncStatusIndicator`)
- Navigation (`AppNavigator`, `AuthNavigator`)
- Database layer (`database.ts`, `connector.ts`)
- Context (`AuthContext`)

For an offline-first app where data mutations happen locally, the hooks and database connector are the highest-risk untested code.

**Recommendation:** Prioritize tests for hooks (mutation logic, SQL construction) and the connector (error handling, retry behavior).

---

### 9. Console Logging in Production Code

**Files:**

- `src/database/connector.ts:44,56,60,66,74,108`
- `src/database/database.ts:53,77`
- `src/utils/secureStorage.ts:12,25,34,47`

Debug logging statements fire in production builds. Some log potentially sensitive information:

```ts
// connector.ts:66
console.log('[PowerSync] Got token, connecting to:', powersyncConfig.powersyncUrl);
```

**Fix:** Wrap with `if (__DEV__)` or use a logging utility that respects the environment.

---

### 10. Error Handling in Connector Lacks Context

**File:** `src/database/connector.ts:73-76, 106-110`

In `fetchCredentials()`, errors are caught, logged, and re-thrown without additional context:

```ts
catch (error) {
  console.error('[PowerSync] fetchCredentials error:', error);
  throw error;  // Raw error propagates with no wrapper
}
```

In `uploadData()`, a failed transaction is thrown but there's no distinction between retryable errors (network timeout) and permanent errors (400 validation failure). PowerSync will retry the transaction indefinitely.

**Fix:** Wrap errors with context. For upload failures, check `response.status` and skip permanent failures (4xx) to avoid infinite retry loops.

---

### 11. Mixed Styling Approaches in Auth Screens

**Files:** `src/screens/auth/LoginScreen.tsx:33-35`, `src/screens/auth/RegisterScreen.tsx:35-37`

Both auth screens create a `StyleSheet` alongside `tva()` styles:

```ts
const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
});
```

This is used for `ScrollView.contentContainerStyle`, which requires a style object (not a className string). The inconsistency is minor but worth noting -- every other screen uses `tva()` exclusively.

**Fix:** Document this as an intentional exception (ScrollView requires style objects), or find a tva-compatible pattern.

---

### 12. Unused Exports Detected by Knip

The following exports are defined but never imported anywhere:

| Export                      | File                                  | Line |
| --------------------------- | ------------------------------------- | ---- |
| `getDatabase()`             | `src/database/database.ts`            | 62   |
| `disconnectDatabase()`      | `src/database/database.ts`            | 73   |
| `useHasPendingChanges()`    | `src/hooks/useSyncStatus.ts`          | 62   |
| `useTestItem()`             | `src/hooks/useTestItems.ts`           | 14   |
| `SYNC_STATUS_POLL_INTERVAL` | `src/constants/config.ts`             | 35   |
| `User` type                 | `src/database/schema.ts`              | 52   |
| `LoginFormData` type        | `src/database/schemas/authSchemas.ts` | 14   |
| `RegisterFormData` type     | `src/database/schemas/authSchemas.ts` | 43   |
| `AuthResponseData` type     | `src/database/schemas/authSchemas.ts` | 59   |

Some of these are intentionally exported for future use (`getDatabase`, `disconnectDatabase`), but others (`SYNC_STATUS_POLL_INTERVAL`, form data types) appear to be leftover from earlier iterations.

**Fix:** Remove genuinely unused exports or add a `// knip-ignore` comment for intentionally pre-exported APIs.

---

## Low Priority Issues

### 13. No Accessibility Support

No `testID` props, `accessibilityLabel` props, or `accessibilityRole` props exist on any interactive element across the entire codebase. This affects:

- Automated UI testing (no selectors for Detox/Appium)
- Screen reader support (no labels for buttons, inputs, or list items)

The `HomeScreen` delete-on-long-press pattern (`src/screens/HomeScreen.tsx:55`) is particularly problematic -- there's no visual or accessible indication that long-pressing deletes an item.

**Fix:** Add `testID` and `accessibilityLabel` to interactive elements incrementally, starting with form inputs and action buttons.

---

### 14. Animated.View Mixes className and style

**File:** `src/components/SyncStatusIndicator.tsx:88-91, 98-100`

```tsx
<Animated.View
  className={dotStyle({})}
  style={{ backgroundColor: config.color, opacity: pulseAnim }}
/>
```

`Animated.View` from React Native doesn't natively support NativeWind's `className` prop. This works because NativeWind patches the component, but mixing `className` (for static styles) with `style` (for animated values) can cause specificity conflicts on some platforms.

**Note:** This may be intentional since animated values (`opacity`, `backgroundColor`) must use the `style` prop. Worth a comment explaining the pattern.

---

### 15. Hardcoded Navigation Params

**File:** `src/screens/HomeScreen.tsx:94-98`

```tsx
navigation.navigate('Details', {
  itemId: 42,
  title: 'Example Item',
});
```

The "Go to Details" button navigates with hardcoded placeholder values. The DetailsScreen renders these values but doesn't fetch any real data. This is clearly placeholder/demo code but should be cleaned up or removed before the app ships.

---

## What's Done Well

- **Zod validation at trust boundaries:** Config URLs validated at startup (`src/constants/config.ts:14`), API responses validated before use (`src/database/connector.ts:65`), form input validated with schemas (`LoginSchema`, `RegisterSchema`). This is exactly right.

- **AuthContext memoization:** `setAuth` and `clearAuth` wrapped in `useCallback`, context value wrapped in `useMemo`. Prevents unnecessary re-renders across the auth boundary.

- **Consistent tva() styling:** Every screen follows the same pattern of defining named style constants with `tva()` at module scope, using variants for conditional styles. Easy to scan and predictable.

- **Type-safe navigation:** `RootStackParamList`, `MainTabParamList`, and `AuthStackParamList` properly defined with `CompositeScreenProps`. Route params are type-checked at every navigation call.

- **Clean barrel exports:** `src/hooks/index.ts`, `src/database/index.ts`, `src/screens/index.ts` all follow the same re-export pattern. Imports throughout the app are clean.

- **Offline-first architecture:** PowerSync + op-sqlite setup is well-structured. The connector cleanly separates auth from data upload. Schema comments explain the timestamp sync behavior clearly.

- **Mock service design:** `authService.ts` implements `IAuthService` interface with a clear plugin-point comment showing how to swap in a real implementation. Good separation of concerns.

---

## Recommendations (Prioritized)

1. **Fix `createUser` type signature** -- remove `password_hash` or remove the entire mutation hook if users are read-only on the client
2. **Delete or integrate `useUsers.ts`** -- dead code should not exist on main
3. **Extract `generateUUID()` to `src/utils/uuid.ts`** -- single source of truth
4. **Add `updated_at` to update mutations** -- consistency with create operations
5. **Remove `./*` fallback from `@/*` path** in `tsconfig.json`
6. **Create proper CSS mock** for Jest instead of mapping to `jest.setup.js`
7. **Add tests for hooks and connector** -- highest risk-to-coverage ratio
8. **Gate console.log with `__DEV__`** -- prevent production information leaks
9. **Add error classification in `uploadData()`** -- prevent infinite retry on 4xx
10. **Clean up unused exports** -- run `npm run knip` and address findings
11. **Add `testID` and accessibility labels** -- incremental, start with forms
