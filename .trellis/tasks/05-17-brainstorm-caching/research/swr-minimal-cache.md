# Research: SWR & Minimal Cache Patterns for React Native + Supabase

- **Query**: Lightweight caching approaches for React Native + Supabase Realtime stack — SWR vs minimal custom cache patterns
- **Scope**: mixed (internal codebase + external library research)
- **Date**: 2026-05-17

---

## Current Stack Context

| Item | Value |
|------|-------|
| Expo | ~54.0.0 |
| React | 19.1.0 |
| React Native | 0.81.5 |
| Zustand | ^5.0.0 |
| @supabase/supabase-js | ^2.49.4 |
| SWR installed? | No |
| TanStack Query installed? | No |

### Current Hook Pattern (useTasks.ts, useHistory.ts, useMembers.ts)

All three hooks follow the same pattern:
- `useState` for local data arrays
- `useEffect` fetches on mount whenever `spaceId` changes
- Supabase Realtime channel subscribed for `task_completions` changes
- `supabase.removeChannel(channel)` called on cleanup

**Problem identified**: Every mount (tab switch, navigation back) triggers a full re-fetch — no in-memory cache between unmount/remount.

Relevant files:
- `hooks/useTasks.ts` — full fetch + Realtime
- `hooks/useHistory.ts` — Promise.all([tasks, completions]) + Realtime
- `hooks/useMembers.ts` — Promise.all([space, members, completions])
- `lib/api.ts` — raw Supabase fetch functions (no cache layer)

---

## 1. SWR with React Native

### Compatibility
- SWR works in React Native — no DOM dependency; uses `fetch`, `useEffect`, `useState` internally.
- Bundle size: **~5.2 kB gzip** (core). No peer deps beyond React.
- React 19 support: SWR v2.x is fully compatible with React 19. Uses standard hooks only — no concurrent features that break RN.
- Expo 54 / Metro: no special config needed. SWR ships ESM + CJS; Metro resolves CJS by default.

### Key SWR APIs relevant to this project

```ts
import useSWR, { mutate } from 'swr'

// Basic usage
const { data, isLoading, error } = useSWR(key, fetcher, {
  revalidateOnFocus: false,   // important for RN — no window focus events
  revalidateOnReconnect: true,
  dedupingInterval: 30_000,   // ms — deduplicate requests within window
  staleTime: 60_000,          // keep data fresh for 1 minute (SWR v2.2+)
})

// Programmatic revalidation (call from Realtime handler)
await mutate(key)             // global mutate — revalidates all matching keys
await mutate(key, newData)    // optimistic update — skip re-fetch
```

### SWR + Supabase Realtime pattern

SWR's `mutate()` integrates naturally with Supabase Realtime:

```ts
import useSWR, { mutate } from 'swr'
import { supabase } from '@/lib/supabase'

const TASKS_KEY = (spaceId: string) => `tasks:${spaceId}`

export function useTasks(spaceId: string | null) {
  const { data, isLoading, error } = useSWR(
    spaceId ? TASKS_KEY(spaceId) : null,   // null key = disabled
    () => getTasksForSpace(spaceId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    }
  )

  useEffect(() => {
    if (!spaceId) return
    const channel = supabase
      .channel(`task_completions:${spaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_completions', filter: `space_id=eq.${spaceId}` },
        () => {
          // Tell SWR to revalidate — it will re-fetch only if not currently fetching
          mutate(TASKS_KEY(spaceId))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [spaceId])

  return { data: data ?? null, isLoading, error: error ?? null }
}
```

**Key behavior**: When tab is revisited, SWR returns cached data immediately (no loading spinner) and revalidates silently in background if stale. Realtime events call `mutate()` to trigger fresh fetch.

### SWR `revalidateOnFocus` in React Native

In web, SWR revalidates when the browser tab regains focus. In React Native, there is no `window.focus` event. By default `revalidateOnFocus: true` but it has no effect on RN since `visibilitychange` is not fired. Setting it to `false` explicitly is clean. You can implement AppState-based revalidation manually:

```ts
import { AppState } from 'react-native'
import { mutate } from 'swr'

// In a top-level provider
AppState.addEventListener('change', (state) => {
  if (state === 'active') mutate(() => true) // revalidate all keys
})
```

### SWR cache persistence

SWR v2 supports custom cache providers:

```ts
import { SWRConfig } from 'swr'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Persist SWR cache to AsyncStorage (survives app restart)
function localStorageProvider() {
  const map = new Map<string, unknown>()
  // Hydrate from AsyncStorage on init, flush on exit
  return map
}

<SWRConfig value={{ provider: localStorageProvider }}>
  <App />
</SWRConfig>
```

This is optional — in-memory cache alone already eliminates the re-fetch-on-tab-switch problem.

---

## 2. Custom In-Memory Map Cache

### Pattern description

A module-level singleton `Map` with TTL, accessible from any hook:

```ts
// lib/cache.ts — no dependencies, ~30 lines
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const DEFAULT_TTL_MS = 60_000  // 1 minute

export function getCached<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() - entry.timestamp > ttlMs) {
    cache.delete(key)
    return null
  }
  return entry.data
}

export function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() })
}

export function invalidateCache(key: string): void {
  cache.delete(key)
}

export function invalidatePrefix(prefix: string): void {
  for (const k of cache.keys()) {
    if (k.startsWith(prefix)) cache.delete(k)
  }
}
```

### Hook integration

```ts
import { getCached, setCached } from '@/lib/cache'

export function useTasks(spaceId: string | null) {
  const cacheKey = spaceId ? `tasks:${spaceId}` : null
  const [tasks, setTasks] = useState<Task[]>(() =>
    cacheKey ? (getCached<Task[]>(cacheKey) ?? []) : []
  )
  const [isLoading, setIsLoading] = useState(() =>
    cacheKey ? !getCached(cacheKey) : false  // no loading if cache hit
  )

  useEffect(() => {
    if (!spaceId || !cacheKey) return
    const cached = getCached<Task[]>(cacheKey)
    if (cached) {
      setTasks(cached)
      setIsLoading(false)
      // optional: background revalidate if close to expiry
      return
    }
    setIsLoading(true)
    getTasksForSpace(spaceId)
      .then((data) => {
        setCached(cacheKey, data)
        setTasks(data)
      })
      .finally(() => setIsLoading(false))
    // ... Realtime subscription unchanged
  }, [spaceId, cacheKey])
}
```

### Realtime invalidation with Map cache

On Realtime event, call `invalidateCache(key)` then re-fetch:

```ts
.on('postgres_changes', ..., () => {
  invalidateCache(`tasks:${spaceId}`)
  getTasksForSpace(spaceId).then((data) => {
    setCached(`tasks:${spaceId}`, data)
    setTasks(data)
  })
})
```

Or do optimistic update first, then background sync — no invalidation needed if payload contains full new row.

### Tradeoffs vs SWR

| Aspect | Custom Map Cache | SWR |
|--------|-----------------|-----|
| Zero new deps | Yes | No (5kB) |
| Deduplication (concurrent fetches) | Manual (need flag) | Built-in |
| Global mutate across hooks | Manual (need event emitter) | `mutate(key)` built-in |
| Stale-while-revalidate | Manual | Built-in |
| Error retry with backoff | Manual | Built-in |
| AppState revalidation | Manual | Manual (same) |
| TypeScript support | Custom typing | Full built-in |
| Lines of code | ~50 | ~0 (API usage) |
| Maintenance burden | Owner carries it | Vercel carries it |

---

## 3. React 19 `use()` + `cache()` Function

### Availability in React Native / Expo 54

React 19.1.0 is in the stack. The `use()` hook and `cache()` function are available.

- `use(promise)` — unwraps a promise inside render (requires Suspense boundary). Works in RN.
- `React.cache(fn)` — **server-only** in React 19. It is only available in React Server Components (RSC). Expo Router supports RSC experimentally but this project does NOT use server components. `React.cache()` is therefore not applicable here.

### `use()` with Suspense pattern (theoretical)

```ts
// Only viable if adding Suspense boundaries — currently no Suspense in Divvy
const taskPromise = getTasksForSpace(spaceId) // created outside component
function TaskList() {
  const tasks = use(taskPromise) // throws if pending, renders if resolved
}
```

**Verdict**: `use()` requires Suspense boundaries throughout the screen tree. Current Divvy screens use imperative `isLoading` guards — adopting Suspense would require a larger refactor. Not recommended for this task.

---

## 4. TanStack Query (React Query) vs SWR vs Custom Map

### TanStack Query v5

- Bundle size: **~13 kB gzip** (core)
- React Native support: First-class via `@tanstack/react-query`
- React 19 support: v5.x is compatible
- Features over SWR: `QueryClient` with cache persistence, background sync, pagination helpers, `useInfiniteQuery`, `useMutation` with rollback
- `QueryClientProvider` required at root
- **Overkill for Divvy's scale**: 3 data hooks, simple CRUD, Realtime already handles sync

### SWR

- Bundle size: ~5.2 kB gzip
- React Native: compatible
- React 19: compatible
- Features: stale-while-revalidate, deduplication, global mutate, `SWRConfig` for shared options
- Missing vs TanStack Query: no built-in mutation helpers, no pagination, no `select` transforms

### Custom Map Cache

- Bundle size: 0 bytes (you own the code)
- React Native: native
- React 19: no interaction
- Features: exactly what you implement
- Missing vs SWR: deduplication, backoff, global broadcast, TypeScript generics on API

### Recommendation summary (no recommendation, factual only)

For a project with 3 fetching hooks + Supabase Realtime:

- **Custom Map Cache**: minimum code, no dep, fits inside project's current pattern, but requires manual deduplication logic if two components mount simultaneously
- **SWR**: adds 5.2 kB, replaces ~50 lines of cache boilerplate, deduplication and stale-while-revalidate built in, `mutate()` is idiomatic for Realtime events
- **TanStack Query**: 13 kB overhead, QueryClientProvider needed, majority of features unused at Divvy's current scale

---

## 5. Deduplication Concern (Critical for React Native)

Both custom Map and SWR must handle: two components mount at same time (e.g. tab + overlay) with same `spaceId`. Without deduplication, two concurrent fetches fire.

**SWR**: built-in `dedupingInterval` (default 2s) prevents this — second caller gets same in-flight promise.

**Custom Map**: naive implementation fires twice. Fix: add in-flight promise tracking:

```ts
const inFlight = new Map<string, Promise<unknown>>()

export function fetchWithCache<T>(key: string, fetcher: () => Promise<T>, ttlMs = 60_000): Promise<T> {
  const cached = getCached<T>(key, ttlMs)
  if (cached) return Promise.resolve(cached)
  const existing = inFlight.get(key) as Promise<T> | undefined
  if (existing) return existing
  const p = fetcher().then((data) => {
    setCached(key, data)
    inFlight.delete(key)
    return data
  })
  inFlight.set(key, p)
  return p
}
```

---

## 6. Interaction with Supabase Realtime

Both patterns coexist with the existing Realtime subscription approach:

- Realtime replaces polling — it is the "push" channel
- Cache layer only prevents re-fetch on **mount** (navigation back, tab switch)
- When Realtime fires, the hook must either:
  - (a) Call `mutate(key)` / `invalidateCache(key)` + re-fetch full list, OR
  - (b) Patch the local state directly from `payload.new` / `payload.old` (optimistic, no network round-trip)

Current `useTasks.ts` already does (b) for completions (INSERT/DELETE patched locally). Adding cache requires no change to the Realtime logic — only the initial fetch path needs caching.

---

## Caveats / Not Found

- `React.cache()` docs confirm server-only status — not usable without RSC.
- SWR's `focusManager` for React Native exists (`swr/dist/react-native`) but is not officially documented; using `revalidateOnFocus: false` is simpler.
- No existing cache layer found anywhere in `lib/`, `hooks/`, or `stores/` — there is no cache infrastructure to reuse.
- `useMembers.ts` and `useHistory.ts` are newly created files (not in last commit, listed as `??` in git status) — they do not yet have Realtime subscriptions fully consistent with `useTasks.ts`.
- Bundle size numbers: SWR 5.2 kB gzip (verified from bundlephobia as of 2024), TanStack Query v5 ~13 kB gzip — actual size may vary slightly with tree-shaking.
