# Research: TanStack Query v5 + Supabase Realtime in React Native / Expo

- **Query**: TanStack Query v5 integration with Supabase Realtime in React Native/Expo stack
- **Scope**: external + internal (codebase analysis)
- **Date**: 2026-05-17

---

## 1. Compatibility — React Native / Expo

### Does it work? Yes, with two manual setups.

`@tanstack/react-query` v5 works in React Native but two browser-specific managers must be replaced:

**focusManager** — defaults to `document.visibilityState` (not available in RN).
Must replace with `AppState`:

```tsx
// Typically in app/_layout.tsx or a root useEffect
import { useEffect } from 'react'
import { AppState, Platform } from 'react-native'
import type { AppStateStatus } from 'react-native'
import { focusManager } from '@tanstack/react-query'

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active')
  }
}

useEffect(() => {
  const subscription = AppState.addEventListener('change', onAppStateChange)
  return () => subscription.remove()
}, [])
```

**onlineManager** — defaults to `window` online/offline events (not available in RN).
Divvy's stack has `expo-network` available (indirectly via expo). Can use:

```tsx
import { onlineManager } from '@tanstack/react-query'
import * as Network from 'expo-network'

onlineManager.setEventListener((setOnline) => {
  let initialised = false
  const eventSubscription = Network.addNetworkStateListener((state) => {
    initialised = true
    setOnline(!!state.isConnected)
  })
  Network.getNetworkStateAsync()
    .then((state) => {
      if (!initialised) setOnline(!!state.isConnected)
    })
    .catch(() => {})
  return eventSubscription.remove
})
```

Source: [Official TanStack Query React Native docs](https://raw.githubusercontent.com/TanStack/query/main/docs/framework/react/react-native.md)

**DevTools in React Native**

No official devtools for RN. Third-party options:
- [rn-better-dev-tools](https://github.com/LovesWorking/rn-better-dev-tools) — macOS app
- Flipper plugin: [react-query-native-devtools](https://github.com/bgaleotti/react-query-native-devtools)

---

## 2. Combining TanStack Query Cache + Supabase Realtime

### The core pattern: `setQueryData` or `invalidateQueries` inside channel handler

TanStack Query gives you `queryClient.setQueryData(key, updater)` for surgical cache mutations, and `queryClient.invalidateQueries(key)` for triggering a full re-fetch. Both are usable outside components (the `queryClient` instance is module-level).

#### Pattern A — Surgical `setQueryData` (optimistic-style, no re-fetch)

Best for low-volume tables with known structure (e.g., `task_completions`). No extra network round-trip.

```tsx
// hooks/useTasks.ts (proposed)
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getTasksForSpace, getRecentCompletions } from '@/lib/api'
import type { TaskCompletion } from '@/types'

export const taskCompletionsKey = (spaceId: string) =>
  ['task_completions', spaceId] as const

export function useTaskCompletions(spaceId: string | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: spaceId ? taskCompletionsKey(spaceId) : ['task_completions', null],
    queryFn: () => (spaceId ? getRecentCompletions(spaceId, 7) : Promise.resolve([])),
    enabled: !!spaceId,
    staleTime: Infinity,        // Realtime handles freshness — do NOT auto-refetch
    gcTime: 10 * 60 * 1000,    // keep in cache 10 min after unmount
    refetchOnWindowFocus: false, // replaced by focusManager / AppState
    refetchOnMount: false,       // first render: served from cache if present
  })

  useEffect(() => {
    if (!spaceId) return

    const channel = supabase
      .channel(`task_completions:${spaceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_completions', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          queryClient.setQueryData<TaskCompletion[]>(
            taskCompletionsKey(spaceId),
            (old = []) => {
              if (payload.eventType === 'INSERT') {
                return [payload.new as TaskCompletion, ...old]
              }
              if (payload.eventType === 'DELETE') {
                return old.filter((c) => c.id !== payload.old.id)
              }
              // UPDATE
              return old.map((c) =>
                c.id === (payload.new as TaskCompletion).id
                  ? (payload.new as TaskCompletion)
                  : c,
              )
            },
          )
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [spaceId, queryClient])

  return {
    data: query.data ?? null,
    isLoading: query.isPending,
    error: query.error,
  }
}
```

#### Pattern B — `invalidateQueries` (simple, triggers re-fetch)

Best when the Realtime payload doesn't contain full row data or when you want server confirmation. Adds one extra Supabase read per Realtime event.

```tsx
.on('postgres_changes', { event: '*', ... }, () => {
  queryClient.invalidateQueries({ queryKey: taskCompletionsKey(spaceId) })
})
```

#### How `supabase-cache-helpers` does it (reference implementation)

The library [`@supabase-cache-helpers/postgrest-react-query`](https://github.com/psteinroe/supabase-cache-helpers) wraps this exact pattern in a `useSubscription` hook that:
1. Sets up a Supabase channel in `useEffect`
2. On INSERT/UPDATE → calls `queryClient.setQueriesData` (surgical update)
3. On DELETE → calls `queryClient.invalidateQueries`
4. Calls `channel.unsubscribe()` in cleanup

It requires `@supabase/postgrest-js ^1.19.4 || ^2.0.0` and `@tanstack/react-query ^4 || ^5`.

Key source files from that library:
- `use-subscription.ts` — channel setup + dispatch to upsert/delete helpers
- `use-upsert-item.ts` — iterates `queryClient.getQueryCache().getAll()` to find matching keys, then calls `queryClient.setQueriesData`

---

## 3. `staleTime` / `gcTime` Best Practices When Using Realtime

### The key insight

With Realtime, data freshness is maintained by the channel, not by polling. This inverts the normal `useQuery` defaults.

| Setting | Default (no Realtime) | Recommended (with Realtime) |
|---|---|---|
| `staleTime` | `0` (immediately stale) | `Infinity` — Realtime owns freshness |
| `gcTime` | `5 * 60 * 1000` (5 min) | `5–10 * 60 * 1000` — keep in memory while tab navigates |
| `refetchOnWindowFocus` | `true` | `false` (or handle via AppState manually) |
| `refetchOnMount` | `true` | `false` or `'always'` depending on pattern |
| `refetchOnReconnect` | `true` | `true` — good to keep; Supabase channel auto-rejoins but a full fetch on reconnect is safe |

**Why `staleTime: Infinity`?** If set to `0`, every `useQuery` mount will immediately mark data as stale and trigger a background re-fetch. With Realtime handling mutations, this means every navigation to the home tab will fire a redundant `getTasksForSpace` call.

**Why keep `refetchOnReconnect: true`?** After app moves offline and back, the Realtime channel may have missed some mutations. A re-fetch on reconnect ensures consistency at the cost of one extra query.

**`gcTime` guidance for Divvy's tab structure:**
- `useTasks` / `useHistory` — `gcTime: 10 * 60 * 1000` (10 min). Navigating tabs unmounts screens; 10 min ensures data is served from cache when switching back.
- `useMembers` — `gcTime: 5 * 60 * 1000` (5 min). Less real-time critical.

---

## 4. Bundle Size Impact

### Numbers (from bundlephobia)

| Package | Minified | Gzipped |
|---|---|---|
| `@tanstack/react-query@5.100.10` | 46,172 bytes (~45KB) | 13,569 bytes (~13KB gzip) |
| `@tanstack/query-core` (peer dep) | ~95KB | included in above |
| `swr@2.4.1` (alternative) | 11,298 bytes (~11KB) | 4,863 bytes (~5KB gzip) |

TanStack Query is ~3x heavier than SWR in gzip terms. For React Native, the metric that matters is JS bundle size (not transfer size), so **~45KB minified** is the real number.

**Verdict for React Native:**
- The 45KB cost is real but reasonable for a mobile app. React Native bundles are typically 1-5 MB.
- `@tanstack/react-query-devtools` should only be included in dev builds — it's large and not needed in production.
- No native modules required — pure JS.

---

## 5. Practical Integration Pattern for Divvy

### Key structural question

Divvy's current hooks (`useTasks`, `useHistory`, `useMembers`) use independent `useState` per hook. This means:
- `app/(app)/(tabs)/index.tsx` mounting `useTasks` → fetches tasks
- `app/(app)/(tabs)/history.tsx` mounting `useHistory` → fetches tasks again (same `getTasksForSpace` call)

With TanStack Query, both screens would share the same cache entry keyed by `['tasks', spaceId]`. The second screen gets instant cache hit.

### Proposed Query Key Convention for Divvy

```ts
// lib/queryKeys.ts
export const queryKeys = {
  tasks: (spaceId: string) => ['tasks', spaceId] as const,
  completions: (spaceId: string) => ['completions', spaceId] as const,
  members: (spaceId: string) => ['members', spaceId] as const,
  space: (spaceId: string) => ['space', spaceId] as const,
}
```

### Full Example: `useTasks` with TanStack Query + Realtime

```tsx
// hooks/useTasks.ts (TanStack Query version)
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getTasksForSpace, getRecentCompletions } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { Task, TaskCompletion } from '@/types'

export function useTasks(spaceId: string | null) {
  const queryClient = useQueryClient()

  const tasksQuery = useQuery({
    queryKey: spaceId ? queryKeys.tasks(spaceId) : ['tasks', null],
    queryFn: () => getTasksForSpace(spaceId!),
    enabled: !!spaceId,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  })

  const completionsQuery = useQuery({
    queryKey: spaceId ? queryKeys.completions(spaceId) : ['completions', null],
    queryFn: () => getRecentCompletions(spaceId!, 7),
    enabled: !!spaceId,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  })

  // Realtime subscription — patches completions cache directly
  useEffect(() => {
    if (!spaceId) return

    const channel = supabase
      .channel(`task_completions:${spaceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_completions', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          queryClient.setQueryData<TaskCompletion[]>(
            queryKeys.completions(spaceId),
            (old = []) => {
              if (payload.eventType === 'INSERT') {
                return [payload.new as TaskCompletion, ...old]
              }
              if (payload.eventType === 'DELETE') {
                return old.filter((c) => c.id !== payload.old.id)
              }
              return old.map((c) =>
                c.id === (payload.new as TaskCompletion).id
                  ? (payload.new as TaskCompletion)
                  : c,
              )
            },
          )
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [spaceId, queryClient])

  return {
    tasks: tasksQuery.data ?? [],
    completions: completionsQuery.data ?? [],
    isLoading: tasksQuery.isPending || completionsQuery.isPending,
    error: tasksQuery.error?.message ?? completionsQuery.error?.message ?? null,
  }
}
```

### QueryClientProvider setup in `app/_layout.tsx`

```tsx
// app/_layout.tsx (additions)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppState, Platform } from 'react-native'
import type { AppStateStatus } from 'react-native'
import { focusManager } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,         // Realtime handles freshness
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
  },
})

// AppState → focusManager bridge (place in root _layout)
function useAppStateFocusBridge() {
  useEffect(() => {
    const onAppStateChange = (status: AppStateStatus) => {
      if (Platform.OS !== 'web') focusManager.setFocused(status === 'active')
    }
    const sub = AppState.addEventListener('change', onAppStateChange)
    return () => sub.remove()
  }, [])
}
```

### Tab screen re-focus refresh (expo-router)

Expo Router uses `expo-router`'s `useFocusEffect`, not React Navigation's. Equivalent pattern:

```tsx
import { useFocusEffect } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'

// In a screen component — refetch stale data when tab gains focus
function useRefreshOnFocus(spaceId: string) {
  const queryClient = useQueryClient()
  const firstRender = useRef(true)

  useFocusEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    queryClient.invalidateQueries({ queryKey: queryKeys.completions(spaceId) })
  })
}
```

---

## 6. Installation

```bash
npm install @tanstack/react-query
```

No native modules, no pods, no `expo install` required. Pure JS. Works with Expo SDK 54, React 19, React Native 0.81.

The devtools package (`@tanstack/react-query-devtools`) is web-only; don't install in RN project. Use the third-party RN tools listed above if needed.

---

## Caveats / Not Found

1. **`expo-network` availability:** Divvy's `package.json` does not currently include `expo-network`. The `onlineManager` setup requires it (or `@react-native-community/netinfo`). Without it, offline/reconnect handling is limited to `refetchOnReconnect: true` only.

2. **`supabase-cache-helpers`:** While relevant, this library adds ~100KB+ of abstraction layer and parses PostgREST filter strings to find matching cache keys across ALL queries. For Divvy's simple schema, the manual `setQueryData` pattern is more transparent and equally effective.

3. **React 19 compatibility:** TanStack Query v5.100.x lists `react ^18 || ^19` as peer dep and is compatible with React 19.1 (Divvy's version).

4. **`useFocusEffect` in expo-router vs React Navigation:** Expo Router's `useFocusEffect` is re-exported from `expo-router`, not from `@react-navigation/native`. The API is identical, so the refresh-on-focus pattern works unchanged.

5. **Supabase Realtime channel limits:** Free tier allows 200 concurrent Realtime connections. Each `useEffect` in the current code creates one channel. With TanStack Query caching, fewer components re-mount, reducing redundant channel subscriptions.

6. **`staleTime: Infinity` tradeoff:** Setting `staleTime: Infinity` means data is NEVER auto-refreshed except via Realtime. If the Realtime channel fails silently, stale data could persist indefinitely. Mitigation: add `refetchOnReconnect: true` and optionally `refetchInterval: 30 * 60 * 1000` (30-min safety poll) for critical data.

---

## Related Specs

- `.trellis/spec/frontend/state-management.md` — current rule: "Zustand does NOT cache server data — hooks own that via local state"
- `.trellis/spec/frontend/hook-guidelines.md` — current useTasks Realtime pattern + hook return shape contract (`{ data, isLoading, error }`)

**Note:** If TanStack Query is adopted, the state-management spec needs update: task arrays would move from hook-local `useState` to TanStack Query cache (still not Zustand). Hook return shape contract can remain identical — `useQuery` results are re-mapped to `{ data, isLoading, error }` in the hook's return.

---

## Internal Files Analyzed

| File | Relevance |
|---|---|
| `hooks/useTasks.ts` | Current Realtime pattern — `useState` + `useEffect` + channel |
| `hooks/useHistory.ts` | Duplicate fetch pattern (`getTasksForSpace` + `getRecentCompletions`) — shared cache solves this |
| `hooks/useMembers.ts` | Poll-on-mount pattern, no Realtime — straightforward `useQuery` candidate |
| `hooks/useTaskActions.ts` | Mutations (tick/skip) — would use `useMutation` + `queryClient.invalidateQueries` |
| `lib/api.ts` | All Supabase query fns — directly usable as `queryFn` in `useQuery` |
| `stores/index.ts` | Zustand — tasks would remain out of Zustand; only session/space/UI stay |
| `.trellis/spec/frontend/state-management.md` | Spec to update if adopted |
| `.trellis/spec/frontend/hook-guidelines.md` | Spec to update: new useTasks pattern |
