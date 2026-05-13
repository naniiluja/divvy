# State Management

## Decision Matrix

| State type | Where it lives |
|-----------|---------------|
| Auth session, user profile | `stores/sessionSlice.ts` (Zustand + persist) |
| Active space ID | `stores/spaceSlice.ts` (Zustand + persist) |
| Task list, completions | `hooks/useTasks.ts` (local useState + Supabase Realtime) |
| UI loading / sheet open | `stores/uiSlice.ts` (Zustand, no persist) |
| Form input values | `useState` in component |
| Navigation params | Expo Router params (`useLocalSearchParams`) |

**Rule:** Supabase is the source of truth for tasks and completions. Zustand does NOT cache server data — it only stores session, active space, and UI state.

## Store Structure (Slices Pattern)

> **Zustand v5 breaking change:** `persist` middleware không tự lưu initial state nữa. Initial values được set qua `partialize` khi hydrate từ AsyncStorage — không cần gọi `setState` thêm cho các giá trị `null`/`undefined` mặc định.

```ts
// stores/index.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createSessionSlice, SessionSlice } from './sessionSlice'
import { createSpaceSlice, SpaceSlice } from './spaceSlice'
import { createUiSlice, UiSlice } from './uiSlice'

type BoundStore = SessionSlice & SpaceSlice & UiSlice

export const useStore = create<BoundStore>()(
  persist(
    (...args) => ({
      ...createSessionSlice(...args),
      ...createSpaceSlice(...args),
      ...createUiSlice(...args),
    }),
    {
      name: 'divvy-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Persist only: session token and active space
        // UiSlice fields intentionally excluded
        session: state.session,
        activeSpaceId: state.activeSpaceId,
      }),
    }
  )
)

// Zustand v5: nếu cần set giá trị dynamic lúc khởi động, phải gọi explicit:
// useStore.setState({ activeSpaceId: loadedFromSomewhereElse })
// Không đặt logic này trong initial state function của slice.
```

## Selector Pattern

Always select only what you need — prevents unnecessary re-renders:

```ts
// Correct
const activeSpaceId = useStore((s) => s.activeSpaceId)

// Wrong — re-renders on ANY store change
const store = useStore()
```

## Forbidden Patterns

- Do not store fetched task arrays in Zustand — keep them in hook-local state fed by Realtime.
- Do not use `immer` middleware unless added explicitly with team consensus.
- Do not call `useStore.getState()` inside a component — use the hook with selector.
- Do not persist UI state (sheet open, loading flags).
