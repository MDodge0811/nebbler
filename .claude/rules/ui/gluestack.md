---
paths:
  - 'components/ui/**'
  - 'tailwind.config.js'
  - 'global.css'
---

# Gluestack UI Deep-Dive

Docs: [Gluestack UI](https://gluestack.io/ui/docs/home/overview/quick-start)

## Architecture

Gluestack UI v2 uses **TVA (Tailwind Variants Array)** for styling, powered by NativeWind. The stack:

```
GluestackUIProvider (mode="light"|"dark")
  └─ CSS variables (config.ts) → Tailwind colors → tva() style definitions → components
```

**Key files:**

- `components/ui/gluestack-ui-provider/config.ts` — CSS variable definitions (light/dark mode)
- `components/ui/gluestack-ui-provider/index.tsx` — Provider wrapping `OverlayProvider` + `ToastProvider`
- `tailwind.config.js` — NativeWind preset, color mappings from CSS vars
- `App.tsx` — `<GluestackUIProvider mode="light">` wraps the app

## Installed Components

```
components/ui/
├── gluestack-ui-provider/   # Theme provider (MUST wrap app)
├── box/                     # Styled View
├── text/                    # Styled Text with size/bold/italic variants
├── button/                  # Full button with Text, Icon, Spinner, Group
├── input/                   # Text input with slots
├── form-control/            # Label + input + helper/error text
├── pressable/               # Styled Pressable
├── spinner/                 # ActivityIndicator wrapper
├── vstack/                  # Vertical flex layout
└── hstack/                  # Horizontal flex layout
```

## TVA Styling Pattern

Every Gluestack component uses `tva()` to define Tailwind class variants:

```typescript
import { tva, withStyleContext, useStyleContext, type VariantProps } from '@gluestack-ui/utils/nativewind-utils';

const SCOPE = 'BUTTON';

// 1. Wrap the root element to provide variant context to children
const Root = withStyleContext(Pressable, SCOPE);

// 2. Define style variants with tva()
const buttonStyle = tva({
  base: 'rounded bg-primary-500 flex-row items-center justify-center',
  variants: {
    action: { primary: '...', secondary: '...', negative: '...' },
    variant: { solid: '', outline: 'bg-transparent border', link: 'px-0' },
    size: { xs: 'px-3.5 h-8', sm: 'px-4 h-9', md: 'px-5 h-10' },
  },
  compoundVariants: [{ action: 'primary', variant: 'link', class: '...' }],
});

// 3. Child styles use parentVariants to inherit from context
const buttonTextStyle = tva({
  base: 'text-typography-0 font-semibold',
  parentVariants: {
    action: { primary: 'text-primary-600', secondary: 'text-typography-500' },
    size: { xs: 'text-xs', md: 'text-base' },
  },
});

// 4. Children read parent variants via useStyleContext
const ButtonText = ({ className, ...props }) => {
  const { variant: parentVariant, size: parentSize, action: parentAction } = useStyleContext(SCOPE);
  return <UIButton.Text className={buttonTextStyle({ parentVariants: { variant: parentVariant, size: parentSize, action: parentAction }, class: className })} {...props} />;
};
```

**Key concepts:**

- `withStyleContext(Component, SCOPE)` — wraps a component to pass variant values down
- `useStyleContext(SCOPE)` — reads parent variant values in child components
- `parentVariants` in `tva()` — styles that respond to the parent's variant choices
- `compoundVariants` / `parentCompoundVariants` — conditional styles when multiple variants combine

## cssInterop for SVG Icons

NativeWind's `cssInterop` bridges Tailwind class names to native SVG props:

```typescript
import { cssInterop } from 'nativewind';
import { PrimitiveIcon } from '@gluestack-ui/core/icon/creator';

cssInterop(PrimitiveIcon, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      height: true,
      width: true,
      fill: true,
      color: 'classNameColor',
      stroke: true,
    },
  },
});
```

This lets you write `<ButtonIcon className="h-4 w-4 text-primary-500" />` and have it map to native SVG props.

## Theming System

Colors are CSS variables with light/dark values:

```
config.ts (CSS vars)  →  tailwind.config.js (color mappings)  →  tva() classes
'--color-primary-500': '51 51 51'    primary-500: 'rgb(var(--color-primary-500)/...)'    'bg-primary-500'
```

**Color palettes available:** primary, secondary, tertiary, error, success, warning, info, typography, outline, background, indicator — each with shades 0–950.

**Special background colors:** background-error, background-warning, background-success, background-muted, background-info.

The `GluestackUIProvider` injects the CSS variables via `config[colorScheme]` at the root `View`.

## Adding a New Gluestack Component

1. Run `npx gluestack-ui add <component>` — scaffolds into `components/ui/<component>/`
2. The scaffolded code imports from `@gluestack-ui/core` and `@gluestack-ui/utils/nativewind-utils`
3. Check if the new component calls `cssInterop()` at module load time — if so, verify the `nativewind` mock in `jest.setup.js` includes `cssInterop: jest.fn()`
4. If the component uses any new NativeWind utility (e.g., `flush()`), add it to the mock

## Removing a Gluestack Component

1. Remove all imports/usage from application code
2. Delete the entire `components/ui/<component>/` directory — Gluestack does NOT auto-clean
3. Run `npm run knip` to verify no orphaned exports remain

## Jest Testing

The `nativewind` mock in `jest.setup.js` **must** include `cssInterop`:

```javascript
jest.mock('nativewind', () => ({
  useColorScheme: () => ({ colorScheme: 'light', setColorScheme: jest.fn() }),
  vars: jest.fn((obj) => obj),
  cssInterop: jest.fn(), // ← required — Gluestack components call this at load time
}));
```

If a new Gluestack component imports additional NativeWind functions, add them to this mock.

## Common Gotchas

- **Component not found after `npx gluestack-ui add`:** Components scaffold to `components/ui/`, NOT `src/components/ui/`. Import from `@/../../components/ui/<component>` or adjust path aliases.
- **Styles not applying:** Check that `GluestackUIProvider` wraps the app and that `tailwind.config.js` content paths include `'./components/**/*.{ts,tsx}'`.
- **Dark mode:** Set via `<GluestackUIProvider mode="dark">`. The provider calls `setColorScheme(mode)` which flips all CSS variable values.
- **Platform-specific files:** Some components have `index.web.tsx` variants for web-specific rendering. The bundler picks the right one automatically.
