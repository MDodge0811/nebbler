const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const reactNativePlugin = require('eslint-plugin-react-native');
const prettierPlugin = require('eslint-plugin-prettier');
const importX = require('eslint-plugin-import-x');
const boundaries = require('eslint-plugin-boundaries');

const compat = new FlatCompat({ baseDirectory: __dirname });

// --- Vendor containment (paid / swappable services) -------------------------
// Each third-party SDK has exactly one "home". Importing it anywhere else is an
// error that points at the adapter to use instead. This is what makes swapping
// a provider (Clerk, PowerSync, …) a single-file change rather than a codebase
// grep. See `.claude/rules/auth.md` and `.claude/rules/powersync/`.
const VENDOR = {
  clerk: {
    group: ['@clerk/**'],
    message:
      'Clerk is a swappable auth provider. Import it only in the auth adapter (src/hooks/useAuth.ts, src/hooks/useAuthFlows.ts) or App.tsx. Elsewhere use useAuth() / useSignInFlow() / useSignUpFlow() / useOAuthSignIn().',
  },
  powersyncEngine: {
    group: ['@powersync/op-sqlite', '@powersync/react-native', '@op-engineering/op-sqlite'],
    message:
      'The PowerSync engine is swappable. Import it only inside src/database/**; everything else goes through the @database barrel.',
  },
  powersyncReact: {
    group: ['@powersync/react'],
    message:
      'PowerSync React hooks belong in the hook layer. Import @powersync/react only in src/hooks/** (or src/database/**). Screens and components must call a hook.',
  },
  secureStore: {
    group: ['expo-secure-store'],
    message:
      'Wrap device storage behind src/utils/secureStorage.ts instead of importing expo-secure-store directly.',
  },
};

const ALL_VENDOR = Object.values(VENDOR);

// Builds a `no-restricted-imports` config that restricts every vendor EXCEPT
// the named keys — i.e. the SDKs this location is allowed to import.
function vendorExcept(...allowedKeys) {
  const allow = new Set(allowedKeys);
  return [
    'error',
    {
      patterns: Object.entries(VENDOR)
        .filter(([key]) => !allow.has(key))
        .map(([, restriction]) => restriction),
    },
  ];
}

module.exports = tseslint.config(
  js.configs.recommended,
  ...compat.extends('plugin:prettier/recommended'),
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        global: 'readonly',
        jest: 'readonly',
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        __DEV__: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-native': reactNativePlugin,
      prettier: prettierPlugin,
      'import-x': importX,
    },
    settings: {
      react: { version: 'detect' },
      'import-x/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
    rules: {
      // --- existing rules (preserved) ---
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-native/no-inline-styles': 'error',
      'react-native/no-color-literals': 'error',
      'react-native/no-raw-text': 'off',
      'react-native/no-unused-styles': 'error',
      'react-native/split-platform-components': 'error',
      'prettier/prettier': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off',
      // --- Complexity ceiling (enforced) ---
      // Cyclomatic-complexity cap. Worst-first offenders were refactored
      // (extracting hooks/presentational components/pure helpers), so this is
      // now an error to lock the ceiling. Functions scoring 11 are acceptable.
      complexity: ['error', { max: 12 }],
      // --- Tier 2a: async safety (NEW) ---
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      // --- Tier 2b: type-safety ---
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      // --- Tier 2c: stylistic + ergonomics ---
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      // --- Tier 3b: import cycle and order ---
      'import-x/no-cycle': ['error', { maxDepth: Infinity }],
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [{ pattern: '@/**', group: 'internal' }],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      // --- Vendor containment: paid/swappable SDKs live behind adapters -----
      // One "home" per SDK; everywhere else must go through the adapter. The
      // per-home overrides below re-allow each SDK in its home.
      'no-restricted-imports': ['error', { patterns: ALL_VENDOR }],
      // --- Styling contract: NativeWind className + Gluestack only ----------
      // StyleSheet.create is banned; dynamic runtime styles go through the
      // named door (components/ui/dynamic/). The four structural reanimated/
      // dimension files are path-exempted below. Do NOT add eslint-disable or
      // widen the exempt list — migrate to tva()/DynamicColorView instead.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.object.name='StyleSheet'][callee.property.name='create']",
          message:
            'StyleSheet.create is banned — use tva() + className (NativeWind). See .claude/rules/ui-components.md.',
        },
      ],
      // Distinct rule key from `no-restricted-imports` (vendor containment) so
      // both stay active without one clobbering the other.
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['View', 'Text', 'Pressable', 'Image', 'TouchableOpacity'],
              message:
                'Use Gluestack: View→@/components/ui/box (Box), Text→@/components/ui/text (Text), Pressable→@/components/ui/pressable, Image/TouchableOpacity→Pressable+Box. Animated/ScrollView/FlatList/KeyboardAvoidingView/Platform stay on react-native.',
            },
          ],
        },
      ],
    },
  },
  // --- Styling path exemptions ----------------------------------------------
  // The named door (DynamicColorView/DynamicColorText) and the four structural
  // reanimated/runtime-dimension files are the ONLY places inline styles and
  // color literals are allowed. This list is closed — growing it needs explicit
  // user sign-off (see docs/superpowers/plans + .claude/rules/ui-components.md).
  {
    files: [
      'components/ui/dynamic/**/*.{ts,tsx}',
      'src/components/calendars/CalendarCheckbox.tsx',
      'src/components/SyncStatusIndicator.tsx',
      'src/components/schedule/week-strip/WeekStrip.tsx',
      'src/components/schedule/month-grid/MonthGrid.tsx',
    ],
    rules: {
      'react-native/no-inline-styles': 'off',
      'react-native/no-color-literals': 'off',
    },
  },
  // --- Vendor homes: re-allow each SDK only where it belongs ----------------
  {
    files: ['src/database/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': vendorExcept('powersyncEngine', 'powersyncReact') },
  },
  {
    files: ['src/hooks/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': vendorExcept('powersyncReact') },
  },
  {
    // The auth adapter is the only non-root place Clerk may be imported.
    files: ['src/hooks/useAuth.ts', 'src/hooks/useAuthFlows.ts'],
    rules: { 'no-restricted-imports': vendorExcept('clerk') },
  },
  {
    files: ['src/utils/secureStorage.ts'],
    rules: { 'no-restricted-imports': vendorExcept('secureStore') },
  },
  {
    // Composition root wires the providers together; it may import anything.
    files: ['App.tsx', 'index.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  // --- Internal layer-direction boundaries (default: disallow) --------------
  // The allow-list is the authoritative architecture contract. A new file in an
  // unclassified location, or a disallowed cross-layer import, is an error.
  {
    files: ['src/**/*.{ts,tsx}', 'App.tsx', 'index.ts'],
    plugins: { boundaries },
    settings: {
      // boundaries resolves @/ aliases via the same TS resolver as import-x.
      'import/resolver': { typescript: { project: './tsconfig.json' } },
      'boundaries/elements': [
        { type: 'root', mode: 'full', pattern: ['App.tsx', 'index.ts'] },
        { type: 'type', pattern: 'src/types/**' },
        { type: 'constant', pattern: 'src/constants/**' },
        { type: 'util', pattern: 'src/utils/**' },
        { type: 'store', pattern: 'src/stores/**' },
        { type: 'data', pattern: 'src/database/**' },
        { type: 'hook', pattern: 'src/hooks/**' },
        { type: 'component', pattern: 'src/components/**' },
        { type: 'screen', pattern: 'src/screens/**' },
        { type: 'nav', pattern: 'src/navigation/**' },
      ],
      'boundaries/ignore': ['**/__tests__/**', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    },
    rules: {
      // Fail-closed on *new* files: anything under src/ in an unclassified
      // location is an error until it's given an element type above.
      'boundaries/no-unknown-files': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            // Composition root wires everything together.
            { from: ['root'], allow: ['*'] },
            // Pure leaf: types import nothing but other types.
            { from: ['type'], allow: ['type'] },
            // constants may read data schemas + a hook type (SyncState) — an
            // accepted, deliberate inversion.
            { from: ['constant'], allow: ['constant', 'type', 'data', 'hook'] },
            // utils stay low-level: data + constants only, never hooks/UI.
            { from: ['util'], allow: ['util', 'type', 'constant', 'data'] },
            // stores hold UI state; may reference data types only.
            { from: ['store'], allow: ['store', 'type', 'data'] },
            // data/engine layer stays low-level.
            { from: ['data'], allow: ['data', 'type', 'constant'] },
            // hooks: the data-access + logic layer.
            { from: ['hook'], allow: ['hook', 'type', 'constant', 'util', 'data'] },
            // components: presentational — may use hooks/stores/utils,
            // but NEVER screens or navigation.
            {
              from: ['component'],
              allow: ['component', 'type', 'constant', 'util', 'hook', 'store', 'data'],
            },
            // screens: orchestration — may use everything below them.
            {
              from: ['screen'],
              allow: [
                'screen',
                'component',
                'nav',
                'hook',
                'store',
                'util',
                'constant',
                'type',
                'data',
              ],
            },
            // navigation: wires screens + components together.
            { from: ['nav'], allow: ['nav', 'screen', 'component', 'hook', 'type', 'constant'] },
          ],
        },
      ],
    },
  },
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      // Tests legitimately import and mock vendor SDKs + raw RN primitives.
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': 'off',
    },
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
  },
  {
    ignores: [
      'node_modules/',
      '.expo/',
      'android/',
      'ios/',
      'dist/',
      'web-build/',
      'coverage/',
      'components/ui/**',
      '.claude/worktrees/**',
    ],
  }
);
