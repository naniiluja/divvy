# Research: Push Notifications — Divvy App

- **Query**: Implement push notifications for "member ticked a task" and "overdue task" triggers
- **Scope**: Mixed (internal codebase + external API knowledge)
- **Date**: 2026-05-14

---

## 1. Internal Codebase State

### Files Found

| File Path | Description |
|---|---|
| `hooks/usePushNotifications.ts` | Hook that registers device and saves `expo_push_token` to `profiles` |
| `types/index.ts` | `Profile` interface already includes `expo_push_token?: string` |
| `.trellis/spec/backend/edge-functions.md` | Patterns for Edge Functions: CORS, auth, `reset-tasks` cron example |
| `.trellis/spec/backend/database-guidelines.md` | Full DB schema + existing `pg_cron` job pattern for `reset-tasks` |
| `supabase/config.toml` | Supabase local config — `deno_version = 2`, `edge_runtime.policy = "per_worker"` |
| `supabase/migrations/20260514014526_initial_schema.sql` | Empty file (schema lives in guidelines spec) |
| `supabase/migrations/20260514022039_fix_rls_policies.sql` | RLS WITH CHECK fixes |

### Key Schema Facts (from spec + production gotchas)

`task_completions` table — production has **both** `user_id` AND `completed_by`:
```sql
create table public.task_completions (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid references public.tasks(id) on delete cascade,
  space_id     uuid references public.spaces(id) on delete cascade,
  user_id      uuid references auth.users(id),
  completed_by uuid references auth.users(id),
  completed_at timestamptz default now(),
  is_skipped   boolean default false
);
```

`profiles` table — already has `expo_push_token` column (confirmed by migration + type):
```sql
-- expo_push_token TEXT column exists in production profiles table
-- usePushNotifications.ts line 34:
await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId)
```

`space_members` table:
```sql
create table public.space_members (
  space_id uuid references public.spaces(id),
  user_id  uuid references public.profiles(id),
  unique(space_id, user_id)
);
```

### Existing pg_cron Pattern (from database-guidelines.md)

```sql
select cron.schedule(
  'reset-tasks',
  '0 * * * *',
  $$
    select net.http_post(
      url := current_setting('app.edge_function_url') || '/reset-tasks',
      headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb
    );
  $$
);
```

The `reset-tasks` Edge Function uses service role key auth with timing-safe comparison.

---

## 2. Supabase Database Webhooks — Triggering Edge Function on task_completions INSERT

### Two Approaches

**Option A: Supabase Dashboard Webhooks (Recommended for simplicity)**

Supabase has a first-class "Database Webhooks" feature (aka "Table Webhooks") available in the Dashboard under Database > Webhooks.

- Fires on INSERT / UPDATE / DELETE on any table
- Calls an HTTP endpoint (your Edge Function URL)
- Automatically sends the row data as JSON body
- Uses `pg_net` under the hood, but abstracts it away
- Auth: pass a custom header (e.g., `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`)

Setup steps:
1. Dashboard > Database > Webhooks > Create a new webhook
2. Name: `on-task-completion`
3. Table: `task_completions`
4. Events: INSERT
5. URL: `https://<project-ref>.supabase.co/functions/v1/notify-task-completion`
6. HTTP Headers: `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`
7. Payload: automatic (sends `{ type, table, schema, record, old_record }`)

Payload shape sent to Edge Function:
```json
{
  "type": "INSERT",
  "table": "task_completions",
  "schema": "public",
  "record": {
    "id": "...",
    "task_id": "...",
    "space_id": "...",
    "user_id": "...",
    "completed_by": "...",
    "completed_at": "2026-05-14T10:00:00Z",
    "is_skipped": false
  },
  "old_record": null
}
```

**Option B: Manual Postgres trigger + pg_net**

For full control, a trigger can call `net.http_post()` directly:

```sql
CREATE OR REPLACE FUNCTION notify_task_completion()
RETURNS trigger AS $$
BEGIN
  -- Only fire for non-skipped completions
  IF NEW.is_skipped = false THEN
    PERFORM net.http_post(
      url    := current_setting('app.edge_function_url') || '/notify-task-completion',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body   := row_to_json(NEW)::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER task_completion_notify
  AFTER INSERT ON public.task_completions
  FOR EACH ROW EXECUTE FUNCTION notify_task_completion();
```

**Important `pg_net` caveats:**
- `net.http_post` is **asynchronous** — it queues the request, does not block the transaction
- The function returns a `bigint` request ID, not the response
- Must use `PERFORM` (not `SELECT`) to discard the return value
- `pg_net` must be enabled: `create extension if not exists pg_net;`
- `current_setting('app.edge_function_url')` requires the setting to be configured via:
  ```sql
  ALTER DATABASE postgres SET app.edge_function_url = 'https://<ref>.supabase.co/functions/v1';
  ALTER DATABASE postgres SET app.service_role_key = '<key>';
  ```
- Alternative: hardcode the URL as a string literal in the trigger (simpler but less portable)

**Recommendation for Divvy**: Use **Dashboard Webhooks** (Option A) — avoids managing `current_setting` config, no trigger migration needed, payload already structured. Manual trigger (Option B) is used only if you need conditional logic (e.g., skip `is_skipped=true` rows) — which is achievable but requires a migration.

---

## 3. pg_cron for Overdue Tasks

### Existing Cron Job

From `database-guidelines.md`, there is already:
- Job name: `'reset-tasks'`
- Schedule: `'0 * * * *'` (every hour at :00)
- Calls: `reset-tasks` Edge Function

### Adding a Second Cron Job for Overdue Alerts

```sql
select cron.schedule(
  'notify-overdue-tasks',        -- unique job name
  '0 21 * * *',                  -- 9pm every day (Vietnam timezone = UTC+7, so 21:00 ICT = 14:00 UTC)
  $$
    select net.http_post(
      url := current_setting('app.edge_function_url') || '/notify-overdue-tasks',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      )::text
    );
  $$
);
```

**pg_cron Schedule Syntax** (standard cron format):
```
┌───────── minute (0-59)
│ ┌───────── hour (0-23) — UTC
│ │ ┌───────── day of month (1-31)
│ │ │ ┌───────── month (1-12)
│ │ │ │ ┌───────── day of week (0-7, Sunday=0 or 7)
│ │ │ │ │
* * * * *
```

Examples:
- `'0 * * * *'` — every hour at :00
- `'0 21 * * *'` — every day at 21:00 UTC
- `'0 14 * * *'` — every day at 14:00 UTC = 21:00 ICT (Vietnam)
- `'30 1 * * *'` — every day at 01:30 UTC

**Note:** pg_cron always runs in UTC. If the app targets Vietnam (UTC+7), schedule the "evening reminder" at `'0 14 * * *'` for 21:00 ICT.

### Listing/Unscheduling Jobs

```sql
-- List all jobs
SELECT * FROM cron.job;

-- Unschedule by name
SELECT cron.unschedule('notify-overdue-tasks');
```

### Overdue Task Query Logic (for Edge Function)

A "daily" task is overdue if it has no `task_completions` row today (where `is_skipped = false`):

```sql
SELECT DISTINCT
  t.space_id,
  t.id AS task_id,
  t.name AS task_name,
  t.icon
FROM public.tasks t
WHERE t.frequency = 'daily'
  AND NOT EXISTS (
    SELECT 1 FROM public.task_completions tc
    WHERE tc.task_id = t.id
      AND tc.is_skipped = false
      AND tc.completed_at >= date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')
      AND tc.completed_at <  date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') + INTERVAL '1 day'
  );
```

---

## 4. Expo Push API — Exact Request Format

### Endpoint

```
URL:    https://exp.host/--/api/v2/push/send
Method: POST
```

### Headers

```
Content-Type:  application/json
Accept:        application/json
Accept-Encoding: gzip, deflate
```

No API key required for basic usage. For production with high volume, use Expo's push notification service with access tokens.

### Single Notification Body

```json
{
  "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "title": "Nam vừa hoàn thành task",
  "body": "🧹 Quét nhà đã được tick lúc 20:30",
  "data": {
    "taskId": "uuid",
    "spaceId": "uuid",
    "completedBy": "uuid"
  },
  "sound": "default",
  "badge": 1,
  "priority": "high",
  "channelId": "default"
}
```

### Batch Sending (Multiple Tokens in One Request)

Send an array to the same endpoint:

```json
[
  {
    "to": "ExponentPushToken[AAAAAAAAAAAA]",
    "title": "Nam vừa tick task",
    "body": "🧹 Quét nhà",
    "sound": "default"
  },
  {
    "to": "ExponentPushToken[BBBBBBBBBBBB]",
    "title": "Nam vừa tick task",
    "body": "🧹 Quét nhà",
    "sound": "default"
  }
]
```

**Batch limit**: Up to **100 notifications per request** (Expo enforces this). For Divvy's use case (household ~2-6 members), a single batch request is sufficient.

### TypeScript / Deno Fetch Example

```ts
const messages = tokens.map(token => ({
  to: token,
  title,
  body,
  data,
  sound: 'default',
  priority: 'high',
  channelId: 'default',
}))

const res = await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: JSON.stringify(messages),
})

const result = await res.json()
// result.data is an array of ticket objects, one per message
```

### Response Format

```json
{
  "data": [
    {
      "status": "ok",
      "id": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
    },
    {
      "status": "error",
      "message": "The recipient device is not registered with FCM.",
      "details": {
        "error": "DeviceNotRegistered"
      }
    }
  ]
}
```

### Error Codes

| Error | Meaning | Action |
|---|---|---|
| `DeviceNotRegistered` | Token no longer valid (uninstalled, revoked) | DELETE `expo_push_token` from `profiles` for that user |
| `InvalidCredentials` | Your Expo push access token is wrong | Fix credentials — affects ALL messages |
| `MessageTooBig` | Payload > 4096 bytes | Shorten body/data |
| `MessageRateExceeded` | Too many sends to one device | Implement exponential backoff |

### Handling DeviceNotRegistered in Deno

```ts
const tickets: Array<{status: string; id?: string; details?: {error?: string}}> = result.data

for (let i = 0; i < tickets.length; i++) {
  const ticket = tickets[i]
  if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
    const invalidToken = tokens[i]
    // Clear the stale token from profiles
    await supabase
      .from('profiles')
      .update({ expo_push_token: null })
      .eq('expo_push_token', invalidToken)
  }
}
```

### Rate Limits

- No documented hard rate limit for individual projects at household scale
- Expo recommends batching (up to 100 per request) rather than many single requests
- For large-scale (>1000/day), use Expo's push receipt API to confirm delivery asynchronously

---

## 5. Querying Space Members' Push Tokens

Given `space_id` from the webhook payload (and `completed_by` to exclude):

```sql
SELECT p.expo_push_token, p.id AS user_id, p.display_name
FROM public.space_members sm
JOIN public.profiles p ON p.id = sm.user_id
WHERE sm.space_id = $1               -- from NEW.space_id
  AND sm.user_id != $2               -- exclude completed_by / user_id
  AND p.expo_push_token IS NOT NULL  -- only users with registered devices
```

In Deno/Supabase client:

```ts
const { data: recipients, error } = await supabase
  .from('space_members')
  .select('profiles(expo_push_token, id, display_name)')
  .eq('space_id', record.space_id)
  .neq('user_id', record.completed_by)

const tokens = recipients
  ?.flatMap(r => (r.profiles as any)?.expo_push_token ? [(r.profiles as any).expo_push_token] : [])
  ?? []
```

**Note on join approach**: Per `database-guidelines.md` gotcha, `.select('profiles!inner(...)')` with `.eq()` filter on joined table can be unreliable. The safer two-step approach:

```ts
// Step 1: Get member user_ids for the space (excluding completer)
const { data: members } = await supabase
  .from('space_members')
  .select('user_id')
  .eq('space_id', spaceId)
  .neq('user_id', completedBy)

const userIds = members?.map(m => m.user_id) ?? []

// Step 2: Get push tokens for those users
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, display_name, expo_push_token')
  .in('id', userIds)
  .not('expo_push_token', 'is', null)

const tokens = profiles?.map(p => p.expo_push_token).filter(Boolean) ?? []
```

---

## 6. Supabase DB Trigger + pg_net Pattern (Full Reference)

### Complete Working Pattern

```sql
-- 1. Ensure pg_net is enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Store config (run once in migration or dashboard SQL editor)
ALTER DATABASE postgres SET app.edge_function_url = 'https://<project-ref>.supabase.co/functions/v1';
ALTER DATABASE postgres SET app.service_role_key = '<your-service-role-key>';

-- 3. Create trigger function
CREATE OR REPLACE FUNCTION notify_task_completion()
RETURNS trigger AS $$
DECLARE
  payload TEXT;
BEGIN
  -- Skip notifications for skipped tasks
  IF NEW.is_skipped = true THEN
    RETURN NEW;
  END IF;

  payload := json_build_object(
    'type', 'INSERT',
    'table', 'task_completions',
    'record', row_to_json(NEW)
  )::text;

  PERFORM net.http_post(
    url     := current_setting('app.edge_function_url') || '/notify-task-completion',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := payload
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach trigger
CREATE TRIGGER task_completion_notify
  AFTER INSERT ON public.task_completions
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_completion();
```

### Key Technical Details

| Aspect | Detail |
|---|---|
| `net.http_post` return type | `bigint` (request ID) — use `PERFORM` not `SELECT` |
| Execution | Async — trigger returns immediately, HTTP fires in background |
| `SECURITY DEFINER` | Required so trigger can read `current_setting` values |
| Error handling | pg_net errors are silent from trigger perspective — check `net._http_response` table |
| `row_to_json(NEW)` | Serializes the entire new row — safe for all column types |

### Checking pg_net Request Results

```sql
-- Inspect recent pg_net requests
SELECT id, status_code, content, error_msg
FROM net._http_response
ORDER BY id DESC
LIMIT 20;
```

### Alternative: Hardcode URL Instead of current_setting

If `current_setting` setup is cumbersome, hardcode directly (less portable but simpler):

```sql
PERFORM net.http_post(
  url     := 'https://abcdefghij.supabase.co/functions/v1/notify-task-completion',
  headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJ..."}'::jsonb,
  body    := row_to_json(NEW)::text
);
```

---

## 7. Edge Function: notify-task-completion (Pattern)

Based on the `reset-tasks` pattern in `edge-functions.md`:

```ts
// supabase/functions/notify-task-completion/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: {
    id: string
    task_id: string
    space_id: string
    user_id: string
    completed_by: string
    completed_at: string
    is_skipped: boolean
  }
  old_record: null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Auth check (same timing-safe pattern as reset-tasks)
  const authHeader = req.headers.get('Authorization') ?? ''
  const expected = `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`
  const encoder = new TextEncoder()
  const a = encoder.encode(authHeader.padEnd(expected.length))
  const b = encoder.encode(expected.padEnd(authHeader.length))
  let diff = a.length ^ b.length
  for (let i = 0; i < Math.min(a.length, b.length); i++) diff |= a[i] ^ b[i]
  if (diff !== 0) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }

  const payload: WebhookPayload = await req.json()
  const { record } = payload

  // Skip notifications for skipped tasks
  if (record.is_skipped) {
    return Response.json({ ok: true, skipped: true }, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Step 1: Get task name for notification body
  const { data: task } = await supabase
    .from('tasks')
    .select('name, icon')
    .eq('id', record.task_id)
    .single()

  // Step 2: Get completer's display name
  const { data: completer } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', record.completed_by)
    .single()

  // Step 3: Get other space members' push tokens (2-step to avoid join filter issue)
  const { data: members } = await supabase
    .from('space_members')
    .select('user_id')
    .eq('space_id', record.space_id)
    .neq('user_id', record.completed_by)

  const userIds = members?.map(m => m.user_id) ?? []
  if (userIds.length === 0) {
    return Response.json({ ok: true, sent: 0 }, { headers: corsHeaders })
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, expo_push_token')
    .in('id', userIds)
    .not('expo_push_token', 'is', null)

  const tokens = profiles?.map(p => p.expo_push_token).filter(Boolean) ?? []
  if (tokens.length === 0) {
    return Response.json({ ok: true, sent: 0 }, { headers: corsHeaders })
  }

  // Step 4: Build and send Expo push notifications
  const messages = tokens.map(token => ({
    to: token,
    title: `${completer?.display_name ?? 'Ai đó'} vừa tick task`,
    body: `${task?.icon ?? ''} ${task?.name ?? 'Unknown task'}`,
    data: { taskId: record.task_id, spaceId: record.space_id },
    sound: 'default',
    priority: 'high',
    channelId: 'default',
  }))

  const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(messages),
  })
  const expoResult = await expoRes.json()

  // Step 5: Handle DeviceNotRegistered errors
  const tickets = expoResult.data ?? []
  for (let i = 0; i < tickets.length; i++) {
    if (tickets[i]?.details?.error === 'DeviceNotRegistered') {
      await supabase
        .from('profiles')
        .update({ expo_push_token: null })
        .eq('expo_push_token', tokens[i])
    }
  }

  return Response.json({ ok: true, sent: tokens.length }, { headers: corsHeaders })
})
```

---

## 8. Profiles Table — expo_push_token Column

The `expo_push_token` column must exist in `profiles`. Evidence:

- `hooks/usePushNotifications.ts` line 34 does `.update({ expo_push_token: token })`
- `types/index.ts` `Profile` interface has `expo_push_token?: string`

If the column does not yet exist in production, add via migration:

```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;
```

RLS note: `expo_push_token` is updated by the user for their own row (UPDATE policy allows `id = auth.uid()`). The Edge Function uses service role key, which bypasses RLS entirely — no policy change needed for the notification function to read tokens.

---

## 9. Implementation Summary — Two Triggers

### Trigger 1: Member ticked a task

| Step | Method | Notes |
|---|---|---|
| Detect INSERT | Dashboard Webhook OR pg_net trigger | Dashboard Webhook is simpler |
| Call | `notify-task-completion` Edge Function | Receives full `record` JSON |
| Query members | 2-step: `space_members` → `profiles` | Exclude `completed_by` |
| Send push | `https://exp.host/--/api/v2/push/send` (batch) | Up to 100 per request |

### Trigger 2: Overdue task alert

| Step | Method | Notes |
|---|---|---|
| Schedule | `pg_cron` new job (daily at 14:00 UTC = 21:00 ICT) | Named `'notify-overdue-tasks'` |
| Call | `notify-overdue-tasks` Edge Function | No payload needed — function queries DB |
| Find overdue | SQL: daily tasks with no completion today | Timezone-aware query |
| Get tokens | For each overdue space: query all member tokens | May send to space_id groups |
| Send push | Same Expo API pattern | One batch per space |

---

## Caveats / Not Found

- **`expo_push_token` in production schema**: Column referenced in code but not in the migration file. Confirm it exists with `SELECT column_name FROM information_schema.columns WHERE table_name='profiles';`
- **Dashboard Webhooks vs trigger**: Dashboard Webhooks do NOT filter on `is_skipped` — the Edge Function must check and return early. A manual trigger can filter at DB level.
- **pg_net `net.http_post` headers parameter type**: In newer Supabase versions, `headers` parameter accepts `jsonb` (not `text`). The `::text` cast in the spec example may need adjustment — use `jsonb_build_object(...)` without cast.
- **Timezone**: The overdue cron job schedule depends on app's target timezone. Adjust cron UTC hour accordingly.
- **`app.edge_function_url` setting**: Not confirmed as set in production. May need to use literal URL in trigger body instead.
- **No existing `notify-task-completion` or `notify-overdue-tasks` functions found** — these need to be created fresh.
