# Type Safety

## Shared Types (`types/index.ts`)

All domain types live in one file. Generated from Supabase schema via `supabase gen types typescript`.

```ts
// types/index.ts — core domain types
export interface Space {
  id: string
  name: string
  created_by: string
  created_at: string
}

export interface Member {
  id: string
  user_id: string
  space_id: string
  display_name: string
  avatar_url: string | null
}

export interface Task {
  id: string
  space_id: string
  name: string
  icon: string            // emoji
  frequency: 'daily' | 'weekly' | '3x_week'
  assignee_id: string | null  // null = anyone can tick
  created_at: string
  last_completion?: TaskCompletion | null
}

export interface TaskCompletion {
  id: string
  task_id: string
  completed_by: string
  completed_at: string
  is_skipped: boolean
}

export interface GeneratedTask {
  name: string
  icon: string
  frequency: Task['frequency']
  assignee_display_name: string | null  // 'rotate' or member name
}
```

## Supabase Type Generation

After any schema change, regenerate types:

```bash
npx supabase gen types typescript --project-id <project-id> > types/supabase.ts
```

Use `Database['public']['Tables']['tasks']['Row']` for raw Supabase types, then map to domain types in `lib/api.ts`.

## Forbidden Patterns

```ts
// Never — swallows type errors
const task = data as any
const task = data!

// Never — untyped API responses
const { data } = await supabase.from('tasks').select('*')
// data is typed by Supabase client — let it be typed

// Never — loose event handlers
const handleTick = (id) => { ... }  // missing type annotation
```

## Required Patterns

```ts
// Edge Function response always typed
interface GenerateTasksResponse {
  tasks: GeneratedTask[]
}
const { data } = await supabase.functions.invoke<GenerateTasksResponse>('generate-tasks', { body })

// Discriminated union for async state
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }
```

## tsconfig Rules

`strict: true` is mandatory. Do not disable `strictNullChecks`.
