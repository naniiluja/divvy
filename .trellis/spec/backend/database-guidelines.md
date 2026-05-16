# Database Guidelines

## Schema

```sql
-- Users are managed by Supabase Auth (auth.users)
-- profiles mirrors auth.users for app-level data
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url  text,
  created_at  timestamptz default now()
);

create table public.spaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz default now()
);

create table public.space_members (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid references public.spaces(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  joined_at   timestamptz default now(),
  unique(space_id, user_id)
);

create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid references public.spaces(id) on delete cascade,
  name        text not null,
  icon        text not null,           -- emoji
  frequency   text not null            -- 'daily' | 'weekly' | '3x_week'
              check (frequency in ('daily', 'weekly', '3x_week')),
  assignee_id uuid references public.profiles(id) on delete set null,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz default now()
);

create table public.task_completions (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid references public.tasks(id) on delete cascade,
  space_id     uuid references public.spaces(id) on delete cascade,  -- denorm for RLS
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz default now(),
  is_skipped   boolean default false
);

create table public.invite_links (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid references public.spaces(id) on delete cascade,
  token      text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz default now()
);
```

## Indexes

```sql
create index on public.tasks(space_id);
create index on public.task_completions(task_id);
create index on public.task_completions(space_id, completed_at desc);
create index on public.space_members(user_id);
create index on public.invite_links(token);
```

## RLS Policies

All tables have `alter table ... enable row level security`.

Pattern: space members can see and modify data within their spaces.

```sql
-- Example: tasks
create policy "space members can read tasks"
  on public.tasks for select
  using (
    exists (
      select 1 from public.space_members
      where space_id = tasks.space_id
      and user_id = (select auth.uid())
    )
  );

create policy "space members can insert tasks"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.space_members
      where space_id = tasks.space_id
      and user_id = (select auth.uid())
    )
  );
```

Same pattern applies to `task_completions`, `space_members`, `invite_links`.

## Naming Conventions

- Tables: `snake_case`, plural (`tasks`, `space_members`)
- Columns: `snake_case`
- PKs: always `id uuid primary key default gen_random_uuid()`
- Timestamps: `created_at timestamptz default now()`
- FKs: `<table_singular>_id` (e.g., `space_id`, `task_id`)
- Indexes: auto-named by Postgres (no manual naming needed)

## Migrations

```bash
# Create new migration
npx supabase migration new <descriptive_name>

# Apply locally
npx supabase db reset

# Push to remote
npx supabase db push
```

Never edit a migration file after it has been pushed to production. Always create a new migration.

## pg_cron — Task Reset Job

```sql
-- Runs every hour, marks tasks that need reset based on frequency
select cron.schedule(
  'reset-tasks',
  '0 * * * *',
  $$
    -- Logic handled by Supabase Edge Function triggered via pg_cron
    select net.http_post(
      url := current_setting('app.edge_function_url') || '/reset-tasks',
      headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb
    );
  $$
);
```

## Realtime

Enable Realtime only on `task_completions`:

```sql
alter publication supabase_realtime add table public.task_completions;
```

Do not enable Realtime on `tasks` or `spaces` in MVP — too much noise.

## Actual DB Schema Gotchas (Production)

### task_completions — Dual user columns

Schema thực tế trên production có **cả hai** `user_id` VÀ `completed_by`:

```sql
-- Actual production schema (khác với spec trên)
create table public.task_completions (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid references public.tasks(id) on delete cascade,
  space_id     uuid references public.spaces(id) on delete cascade,
  user_id      uuid references auth.users(id),       -- ← cột thực tế
  completed_by uuid references auth.users(id),       -- ← cột thực tế
  completed_at timestamptz default now(),
  is_skipped   boolean default false
);
```

Khi INSERT phải set cả hai:

```ts
await supabase.from('task_completions').insert({
  task_id, space_id,
  user_id: userId,       // ← bắt buộc
  completed_by: userId,  // ← bắt buộc
  is_skipped: false,
})
```

TypeScript type cũng phải có cả hai:

```ts
export interface TaskCompletion {
  id: string
  task_id: string
  space_id: string
  user_id: string      // ← thêm vào
  completed_by: string
  completed_at: string
  is_skipped: boolean
}
```

### spaces — owner_id (không phải created_by)

Spaces table dùng `owner_id` (không phải `created_by`) làm FK chính:

```ts
// Đúng
await supabase.from('spaces').insert({ name, emoji, owner_id: userId, created_by: userId })

// Sai (thiếu owner_id → FK violation)
await supabase.from('spaces').insert({ name, emoji, created_by: userId })
```

### getSpacesForUser — Không dùng !inner join

`.eq('space_members.user_id', userId)` trên join unreliable. Dùng 2-step query:

```ts
// Đúng
const { data: memberRows } = await supabase
  .from('space_members').select('space_id').eq('user_id', userId)
const spaceIds = memberRows.map(r => r.space_id)
const { data } = await supabase.from('spaces').select('*').in('id', spaceIds)

// Sai — !inner join filter unreliable
const { data } = await supabase
  .from('spaces').select('*, space_members!inner(user_id)')
  .eq('space_members.user_id', userId)
```

---

## Scenario: PostgREST Embedding — `profiles(...)` Join Requires Public FK

### 1. Scope / Trigger

`getSpaceMembers()` join `space_members → profiles` qua PostgREST `select('*, profiles(...)')`. Trigger: cross-layer contract (client query depends on DB FK declaration), failed with `PGRST200`.

### 2. Validation & Error Matrix

| Condition | Error | Fix |
|---|---|---|
| `space_members.user_id` FK → `auth.users(id)` only | `PGRST200: Could not find a relationship between 'space_members' and 'profiles' in the schema cache` | Add FK to `profiles(id)` OR use 2-step client query |
| `space_members.user_id` FK → `public.profiles(id)` | works | — |
| FK to both `auth.users` and `profiles` | works (PostgREST picks public) | — |

### 3. Wrong vs Correct

#### Wrong: PostgREST join without public FK

```ts
// ❌ Returns PGRST200 if space_members.user_id FK only points to auth.users
const { data } = await supabase
  .from('space_members')
  .select('*, profiles(display_name, avatar_emoji)')
  .eq('space_id', spaceId)
```

#### Correct Option A: 2-step query (client-side join, no schema change)

```ts
// ✅ Works regardless of FK setup
const { data: memberRows } = await supabase
  .from('space_members').select('*').eq('space_id', spaceId)

const userIds = memberRows.map((m) => m.user_id)
const { data: profileRows } = await supabase
  .from('profiles').select('id, display_name, avatar_emoji').in('id', userIds)

const profileMap = new Map(profileRows.map((p) => [p.id, p]))
return memberRows.map((m) => ({ ...m, profiles: profileMap.get(m.user_id) }))
```

#### Correct Option B: Add public FK to migration

```sql
-- Migration: link space_members.user_id to public.profiles
alter table public.space_members
  add constraint space_members_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;
```

### 4. Why

PostgREST builds its relationship cache from `information_schema.table_constraints` where `table_schema = 'public'`. FK pointing to `auth.users` is invisible because `auth` schema is filtered out. Without a `public.*` FK target, embedded resource resolution fails.

---

## Scenario: RLS Recursion via Helper Functions

### 1. Scope / Trigger

Helper SQL function `is_space_member(space_id, user_id)` called from RLS policy on `space_members` itself. Trigger: infra/security boundary — function queries the same table it's protecting.

### 2. Validation & Error Matrix

| Condition | Symptom | Fix |
|---|---|---|
| RLS policy on `space_members` uses `is_space_member()` AND function lacks `SECURITY DEFINER` | Query returns 0 rows silently (RLS denies), or infinite recursion error | Add `SECURITY DEFINER` to function |
| `SECURITY DEFINER` without `SET search_path` | Privilege escalation risk if owner is superuser | Always pair with `SET search_path = public` |

### 3. Wrong vs Correct

#### Wrong: SECURITY INVOKER (default)

```sql
-- ❌ Function runs as caller → caller's RLS applies → recursion on space_members
create or replace function public.is_space_member(p_space_id uuid, p_user_id uuid)
returns boolean
language sql
as $$
  select exists (
    select 1 from public.space_members
    where space_id = p_space_id and user_id = p_user_id
  );
$$;

-- Policy that uses it
create policy "space members read" on public.space_members for select
  using (is_space_member(space_id, (select auth.uid())));
-- → SELECT triggers RLS → calls is_space_member → which SELECTs space_members → RLS → ...
```

#### Correct: SECURITY DEFINER with locked search_path

```sql
-- ✅ Function runs as definer (typically postgres) → bypasses caller's RLS → no recursion
create or replace function public.is_space_member(p_space_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public      -- ← REQUIRED: prevent search-path hijack
as $$
  select exists (
    select 1 from public.space_members
    where space_id = p_space_id and user_id = p_user_id
  );
$$;
```

### 4. Tests Required

- Unit (SQL): run policy SELECT as authenticated role, assert returns expected rows
- Negative: assert non-member gets 0 rows (RLS still enforced for non-membership)
- Regression: log query plan should NOT show recursive scan on `space_members`

### 5. Gotcha: Disabling RLS in MVP

> **Warning**: Disabling RLS via `alter table ... disable row level security` is a valid MVP escape hatch but means **anon and authenticated roles can read/write all rows**. Document explicitly which tables have RLS off + planned re-enable date.

```sql
-- MVP shortcut (planned re-enable after launch)
alter table public.space_members disable row level security;
alter table public.profiles disable row level security;
-- ...
```

Re-enable path: rewrite policies to use `SECURITY DEFINER` helpers, then `enable row level security` per table.
