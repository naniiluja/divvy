# Research: Zustand v5 Cache Layer Pattern

- **Query**: Pattern dùng Zustand v5 làm cache layer cho server data (không phải TanStack Query) trong React Native + Supabase stack
- **Scope**: mixed (internal codebase + library API surface)
- **Date**: 2026-05-17

---

## 1. Current State of the Codebase

### Installed Zustand Version
`zustand@5.0.13` (exact, from node_modules). `immer` is NOT in package.json — not installed. `subscribeWithSelector` middleware IS bundled.

### Active Store Shape
```
stores/index.ts        — BoundStore = SessionSlice & SpaceSlice & UiSlice
stores/sessionSlice.ts — session: Session|null, user: User|null
stores/spaceSlice.ts   — activeSpaceId: string|null
stores/uiSlice.ts      — isLoading, activeSheet, themeOverride, accentKey, toast
```

`persist` middleware wraps the entire store; `partialize` saves only `activeSpaceId`, `themeOverride`, `accentKey` to AsyncStorage.

### Current "Hooks Own Local State" Pattern
Each data hook (useTasks, useHistory, useMembers, useSpace) keeps its own `useState` arrays. On mount it fires a Supabase query, then subscribes to Realtime. On Realtime event it mutates local state directly (optimistic-style INSERT/DELETE splice). Example from `hooks/useTasks.ts` (lines 41–51):

```ts
.on('postgres_changes', { event: '*', table: 'task_completions', filter }, (payload) => {
  if (payload.eventType === 'INSERT')
    setCompletions((prev) => [payload.new as TaskCompletion, ...prev])
  else if (payload.eventType === 'DELETE')
    setCompletions((prev) => prev.filter((c) => c.id !== payload.old.id))
})
```

The `useHistory` hook duplicates almost the same subscription logic for the same `task_completions` table (lines 42–68 of `hooks/useHistory.ts`). This creates **two independent Supabase channels** for the same data when both tabs are mounted.

### Spec Rule (state-management.md line 14)
> "Supabase is the source of truth for tasks and completions. Zustand does NOT cache server data."

And (state-management.md line 78):
> "Do not use `immer` middleware unless added explicitly with team consensus."

---

## 2. Zustand v5 API Surface Relevant to Caching

### `StateCreator` Signature (v5)
Full 4-generic form is required:
```ts
StateCreator<BoundStore, [], [], SliceType>
```
Without the 4th generic, TypeScript inference fails in v5. (confirmed in spec and in vanilla.d.ts)

### `immer` Middleware (bundled but `immer` package not installed)
The middleware file exists at `node_modules/zustand/middleware/immer.js` but it requires `immer` as a peer dependency. Installing `immer` would enable draft-mutating setState:
```ts
set((draft) => { draft.tasks[spaceId] = newTasks })
```
This is the only middleware blocked by the spec ("team consensus required").

### `subscribeWithSelector` Middleware
Enables subscribing to a slice of state from outside React (e.g., from a Realtime event handler):
```ts
useStore.subscribe(
  (s) => s.tasks[spaceId],
  (tasks) => { /* react to cache changes */ }
)
```

### `persist` Middleware
`partialize` controls what gets serialized. It supports `onRehydrateStorage` callback (invoked after hydration from AsyncStorage). This is the hook point to invalidate stale cached data on app restart.

---

## 3. Zustand-as-Cache Pattern (TTL-Based)

### Shape of a Cache Slice
```ts
interface CacheEntry<T> {
  data: T
  fetchedAt: number   // Date.now() ms timestamp
}

interface TaskCacheSlice {
  taskCache: Record<string, CacheEntry<Task[]>>       // keyed by spaceId
  completionCache: Record<string, CacheEntry<TaskCompletion[]>>
  setTaskCache: (spaceId: string, tasks: Task[]) => void
  patchCompletion: (spaceId: string, completion: TaskCompletion) => void
  removeCompletion: (spaceId: string, completionId: string) => void
  invalidateSpace: (spaceId: string) => void
}
```

### TTL Validation Logic (in the hook)
```ts
const CACHE_TTL_MS = 5 * 60 * 1000  // 5 minutes

function isFresh(entry: CacheEntry<unknown> | undefined): boolean {
  if (!entry) return false
  return Date.now() - entry.fetchedAt < CACHE_TTL_MS
}
```

Hook reads cache first: if fresh, returns cached data immediately. If stale or absent, fetches from Supabase and writes back.

### Supabase Realtime → Zustand `setState` Bridge
The key insight: Realtime handlers currently live inside `useEffect` (component lifecycle). With centralized cache, they would move to a **singleton subscription** at app bootstrap (e.g., in `app/_layout.tsx` or a context provider):

```ts
// Pseudo-code — bootstrapped once, not inside a component hook
const channel = supabase
  .channel(`task_completions:${spaceId}`)
  .on('postgres_changes', { event: '*', table: 'task_completions', filter }, (payload) => {
    if (payload.eventType === 'INSERT') {
      useStore.getState().patchCompletion(spaceId, payload.new as TaskCompletion)
    } else if (payload.eventType === 'DELETE') {
      useStore.getState().removeCompletion(spaceId, payload.old.id)
    }
  })
  .subscribe()
```

Note: calling `useStore.getState()` here is OUTSIDE a component (it's an event callback), so the architecture rule "do not call `useStore.getState()` inside a component" does NOT apply.

---

## 4. Comparison: "Hooks Own Local State" vs "Centralized Zustand Cache"

| Dimension | Current: Hooks Local State | Alternative: Zustand Cache |
|---|---|---|
| **Subscription count** | N hooks × M screens = N*M channels open simultaneously | 1 channel per table per space (singleton) |
| **Data sharing across tabs** | Each tab refetches independently on mount | All tabs read same cache entry, no duplicate fetch |
| **Complexity** | Low — each hook is self-contained | Higher — cache invalidation, TTL logic, slice typing |
| **Offline / background** | Data lost on unmount; re-fetches on re-mount | Data survives tab switches (in-memory); survives app restart if persisted |
| **Realtime patch** | Local setCompletions splice — fast | Store.patchCompletion — fast, but must coordinate with subscribeWithSelector |
| **Immer needed?** | No — simple array spread is enough | Strongly beneficial for nested Record<spaceId, ...> updates; blocked by spec rule |
| **Code duplication** | useTasks and useHistory both subscribe to same table | Single cache slice, hooks just read |
| **TypeScript safety** | Straightforward | Cache slice StateCreator must carry full 4-generic + immer mutation type |
| **Spec compliance** | Fully compliant | Violates current rule "Do NOT cache server data in Zustand" — requires spec amendment |

---

## 5. AsyncStorage Persist vs In-Memory Only

### In-Memory Only (no persist change)
- Data lost on app kill/restart; user sees loading spinner on cold start.
- No migration concerns.
- Simpler: just add a new slice without touching `partialize`.

### Persist Cached Data via AsyncStorage
- Add cache slice fields to `partialize`:
  ```ts
  partialize: (state) => ({
    activeSpaceId: state.activeSpaceId,
    themeOverride: state.themeOverride,
    accentKey: state.accentKey,
    taskCache: state.taskCache,        // <-- new
    completionCache: state.completionCache,
  })
  ```
- **Tradeoffs**:
  - Stale data from previous session shown on cold start until TTL check resolves.
  - AsyncStorage JSON.stringify of large task arrays adds startup I/O cost.
  - `version` bump required when cache shape changes (already at `version: 1`, would become `version: 2` with `migrate` handler).
  - `onRehydrateStorage` callback can trigger a background refetch after hydration to refresh stale entries.
- **Risk**: If user has 50+ tasks and 7 days of completions (~hundreds of rows), AsyncStorage size could be significant but within limits (AsyncStorage default limit ~6MB per key on Android).

---

## 6. Key Caveats

1. **`immer` is not installed** — installing it requires explicit decision (spec rule). Without immer, nested Record updates require verbose spread syntax:
   ```ts
   setTaskCache: (spaceId, tasks) => set((s) => ({
     taskCache: { ...s.taskCache, [spaceId]: { data: tasks, fetchedAt: Date.now() } }
   }))
   ```
   This works but becomes messy for deeply nested patch operations.

2. **Singleton channel location** — if Realtime subscription moves out of hooks into a layout/provider, the cleanup must also move there. Currently `supabase.removeChannel()` is called in hook `useEffect` cleanup. A singleton subscription lives until explicit teardown (e.g., on logout in `clearSession`).

3. **`subscribeWithSelector` middleware stacking** — to use both `persist` and `subscribeWithSelector`, the middleware must be stacked correctly in v5:
   ```ts
   create<BoundStore>()(
     subscribeWithSelector(
       persist((...args) => ({ ...slices }), persistOptions)
     )
   )
   ```
   The order matters: `subscribeWithSelector` wraps `persist`.

4. **Spec amendment required** — the current `state-management.md` spec explicitly forbids storing server data in Zustand and using immer. Any implementation of this pattern requires updating the spec first.

5. **`useStore.getState()` in Realtime callbacks** — this is legitimate use (outside component tree), but the spec rule reads broadly as a blanket ban. Needs clarification.

6. **No `immer` = no draft mutation type on `StateCreator`** — without immer middleware, the TTL cache slice is safe to type with just `StateCreator<BoundStore, [], [], TaskCacheSlice>`.

---

## Files Found

| File Path | Description |
|---|---|
| `stores/index.ts` | BoundStore composition, persist config, partialize |
| `stores/sessionSlice.ts` | Session/user slice, StateCreator v5 typing example |
| `stores/spaceSlice.ts` | activeSpaceId slice |
| `stores/uiSlice.ts` | UI-only state: sheet, theme, toast |
| `hooks/useTasks.ts` | Current pattern: local useState + Realtime subscription |
| `hooks/useHistory.ts` | Duplicates task_completions subscription for history tab |
| `hooks/useMembers.ts` | Pure fetch, no Realtime, uses refetch pattern |
| `hooks/useSpace.ts` | Reads activeSpaceId from Zustand, data in local state |
| `lib/api.ts` | All Supabase query functions (getTasksForSpace, getRecentCompletions, etc.) |
| `node_modules/zustand/middleware/immer.js` | Immer middleware — wraps produce() over setState |
| `node_modules/zustand/middleware/immer.d.ts` | Immer middleware types — Draft-based setState |
| `node_modules/zustand/middleware/persist.d.ts` | Persist middleware types — PersistOptions, partialize, migrate |
| `node_modules/zustand/middleware/subscribeWithSelector.d.ts` | Selector-based subscribe for out-of-React usage |
| `node_modules/zustand/vanilla.d.ts` | StateCreator, StoreApi, Mutate types (v5 core) |
| `.trellis/spec/frontend/state-management.md` | Spec ruling against server data in Zustand and immer |
| `.trellis/spec/frontend/hook-guidelines.md` | useTasks pattern, removeChannel cleanup requirement |

---

## Related Specs

- `.trellis/spec/frontend/state-management.md` — forbids caching server data in Zustand; forbids immer without consensus
- `.trellis/spec/frontend/hook-guidelines.md` — mandates `{ data, isLoading, error }` return shape; mandates removeChannel on unmount
