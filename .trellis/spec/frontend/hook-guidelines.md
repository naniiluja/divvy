# Hook Guidelines

## Standard Hook Return Shape

Every data-fetching hook returns this shape:

```ts
interface HookResult<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
}
```

No exceptions. Components should never receive `undefined` — use `null` for missing data.

## SWR — Caching Pattern (Required for all data-fetching hooks)

All data-fetching hooks use `useSWR` instead of `useEffect + useState`. Global config is set in `lib/swrConfig.ts` and wired via `<SWRConfig>` in `app/_layout.tsx`.

Key rules:
- SWR key is always a tuple `[resource, id]` — e.g. `['tasks', spaceId]`
- Use `null` key to conditionally skip fetch: `useSWR(spaceId ? ['tasks', spaceId] : null, fetcher)`
- `revalidateOnFocus: false` globally — React Native has no visibilitychange event
- Realtime handlers call `mutate(updaterFn, { revalidate: false })` to patch cache in-place (no re-fetch)
- `supabase.removeChannel(channel)` must be called in `useEffect` cleanup — Realtime subscription lives separately from SWR fetch

## useTasks — SWR + Realtime Pattern

```ts
export function useTasks(spaceId: string | null) {
  const { data, isLoading, error, mutate } = useSWR<TasksData>(
    spaceId ? ['tasks', spaceId] : null,
    async () => {
      const tasks = await getTasksForSpace(spaceId!)
      const completions = tasks.flatMap((t) => t.task_completions ?? [])
      return { tasks, completions }
    },
  )

  useEffect(() => {
    if (!spaceId) return
    const channel = supabase
      .channel(`task_completions:${spaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_completions', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          mutate((prev) => {
            if (!prev) return prev
            if (payload.eventType === 'INSERT')
              return { ...prev, completions: [payload.new as TaskCompletion, ...prev.completions] }
            if (payload.eventType === 'DELETE')
              return { ...prev, completions: prev.completions.filter((c) => c.id !== payload.old.id) }
            return prev
          }, { revalidate: false })
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [spaceId, mutate])

  return { tasks: data?.tasks ?? [], completions: data?.completions ?? [], isLoading, error }
}
```

## useSession

Wraps `supabase.auth.getSession()` and listens to `onAuthStateChange`. Lives in `hooks/useSession.ts`. Do not call Supabase auth directly in components.

```ts
export function useSession() {
  const session = useStore((s) => s.session)
  const isLoading = useStore((s) => s.isSessionLoading)
  return { session, isLoading, isAuthenticated: !!session }
}
```

> Return shape must include `isLoading` — `app/(app)/_layout.tsx` depends on it to show splash before redirecting.

## useAIGenerate

Calls the `generate-tasks` Edge Function. Never calls Anthropic API directly from the app.

```ts
export function useAIGenerate() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const generate = async (input: string, members: Member[]): Promise<GeneratedTask[]> => {
    setIsGenerating(true)
    setError(null)
    try {
      const { data, error } = await supabase.functions.invoke('generate-tasks', {
        body: { input, members },
      })
      if (error) throw new Error(error.message)
      return data.tasks as GeneratedTask[]
    } catch (e) {
      setError(e as Error)
      return []
    } finally {
      setIsGenerating(false)
    }
  }

  return { generate, isGenerating, error }
}
```

## Rules

- Hooks that subscribe to Supabase Realtime must return a cleanup function from `useEffect`.
- Hooks never navigate (`router.push`) — return data and let the screen decide.
- Hooks never show alerts/toasts — throw errors upward for the UI to display.
- All async operations in hooks wrapped in try/catch with typed error state.
