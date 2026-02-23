---
paths:
  - 'src/stores/**'
---

# Zustand Store Patterns

Docs: [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction), [Persist middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)

## Store Structure

Stores live in `src/stores/` and follow the naming convention `use<Feature>Store.ts`.

```typescript
import { create } from 'zustand';

interface ExampleState {
  // State
  value: string;
  // Actions
  setValue: (value: string) => void;
}

export const useExampleStore = create<ExampleState>()((set) => ({
  value: '',
  setValue: (value) => set({ value }),
}));
```

State and actions are defined together in the same `create` call — no separate action creators or reducers.

## Selectors

Always use selectors to read individual fields. This prevents re-renders when unrelated state changes.

```typescript
// GOOD — only re-renders when selectedDate changes
const selectedDate = useScheduleStore((s) => s.selectedDate);

// BAD — re-renders on ANY store change
const { selectedDate } = useScheduleStore();
```

## Reading/Writing Outside React

Zustand stores can be accessed outside components via `getState()` and `setState()`:

```typescript
// Read
const date = useScheduleStore.getState().selectedDate;

// Write
useScheduleStore.getState().selectDate('2026-03-15');
```

This is useful in gesture callbacks, event handlers, and utility functions that don't have access to hooks.

## Persist Middleware

For state that should survive app restarts, wrap with `persist` and use `partialize` to select only what gets persisted:

```typescript
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useExampleStore = create<ExampleState>()(
  persist(
    (set) => ({
      // ...state and actions
    }),
    {
      name: 'example-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist user preferences, not transient UI state
        preference: state.preference,
      }),
    }
  )
);
```

**Rule:** Only persist user preferences and settings. Never persist transient state like scroll positions, selected dates, or loading flags.

## Testing

Test stores directly via `getState()` / `setState()` — no component rendering needed:

```typescript
import { useExampleStore } from '../useExampleStore';

describe('useExampleStore', () => {
  beforeEach(() => {
    // Reset to defaults to prevent test leakage
    useExampleStore.setState({
      value: '',
    });
  });

  it('setValue updates value', () => {
    useExampleStore.getState().setValue('hello');
    expect(useExampleStore.getState().value).toBe('hello');
  });
});
```

AsyncStorage is globally mocked in `jest.setup.js` (`getItem` returns `null`, so persist middleware uses defaults).

## Adding a New Store

1. Create `src/stores/use<Feature>Store.ts`
2. Add tests in `src/stores/__tests__/use<Feature>Store.test.ts`
3. If using `persist` middleware, ensure `partialize` only includes user preferences
4. Import with `@stores/use<Feature>Store` path alias
