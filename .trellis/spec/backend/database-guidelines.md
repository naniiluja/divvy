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
