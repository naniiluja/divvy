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

## useTasks — Realtime Pattern

Supabase Realtime subscription must be cleaned up on unmount:

```ts
export function useTasks(spaceId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!spaceId) return

    setIsLoading(true)

    // Initial fetch
    supabase
      .from('tasks')
      .select('*, task_completions(*)')
      .eq('space_id', spaceId)
      .then(({ data, error }) => {
        if (error) setError(new Error(error.message))
        else setTasks(data ?? [])
        setIsLoading(false)
      })

    // Realtime subscription
    const channel = supabase
      .channel(`tasks:${spaceId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'task_completions',
        filter: `space_id=eq.${spaceId}`,
      }, () => {
        // Re-fetch on any change — simpler than merging patches
        supabase
          .from('tasks')
          .select('*, task_completions(*)')
          .eq('space_id', spaceId)
          .then(({ data }) => setTasks(data ?? []))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [spaceId])

  return { data: tasks, isLoading, error }
}
```

## useSession

Wraps `supabase.auth.getSession()` and listens to `onAuthStateChange`. Lives in `hooks/useSession.ts`. Do not call Supabase auth directly in components.

```ts
export function useSession() {
  const session = useSessionStore((s) => s.session)
  return { session, isAuthenticated: !!session }
}
```

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
