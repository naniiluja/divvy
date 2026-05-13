# Edge Functions

## Rules

1. Always return CORS headers (handle OPTIONS preflight).
2. Always use caller's JWT for RLS — create Supabase client with `Authorization` header.
3. Secrets accessed only via `Deno.env.get()`. Never hardcode.
4. Always return `{ error: string }` with appropriate HTTP status on failure.
5. Response Content-Type is always `application/json`.

## CORS Shared Helper

```ts
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}
```

## generate-tasks Function

Receives free-text input + members list, returns structured task array via Claude API.

```ts
// supabase/functions/generate-tasks/index.ts
import { corsHeaders } from '../_shared/cors.ts'
import Anthropic from 'npm:@anthropic-ai/sdk@0.39'

interface GenerateTasksRequest {
  input: string           // free-text from user
  members: { id: string; display_name: string }[]
}

interface GeneratedTask {
  name: string
  icon: string
  frequency: 'daily' | 'weekly' | '3x_week'
  assignee_display_name: string | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { input, members }: GenerateTasksRequest = await req.json()

    if (!input || !members?.length) {
      return Response.json(
        { error: 'input and members are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const client = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    })

    const membersList = members.map((m) => m.display_name).join(', ')

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a household task organizer. Given a list of tasks and household members, create a structured task list with fair assignment.

Members: ${membersList}

Tasks described by user: "${input}"

Return ONLY a JSON array (no markdown, no explanation) in this format:
[
  {
    "name": "Task name in Vietnamese",
    "icon": "single emoji",
    "frequency": "daily" | "weekly" | "3x_week",
    "assignee_display_name": "member name or null for anyone"
  }
]

Rules:
- Split compound tasks (e.g., "cho chó ăn sáng tối" → 2 tasks)
- Distribute evenly across members
- Use Vietnamese task names
- Pick the most appropriate emoji for each task`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const tasks: GeneratedTask[] = JSON.parse(content.text)

    return Response.json({ tasks }, { headers: corsHeaders })
  } catch (error) {
    console.error('generate-tasks error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
})
```

## reset-tasks Function

Called by pg_cron hourly. Marks expired completions as stale so tasks re-appear as pending.

```ts
// supabase/functions/reset-tasks/index.ts
// Uses service role key — called by pg_cron, not by app users
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify this is called by service role (pg_cron), not a user
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Task reset logic: a "daily" task needs a new completion every calendar day
  // This function is idempotent — safe to run multiple times
  const now = new Date().toISOString()
  const { error } = await supabase.rpc('reset_expired_tasks', { check_time: now })

  if (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders })
  }

  return Response.json({ ok: true, timestamp: now }, { headers: corsHeaders })
})
```

## Deploying

```bash
# Deploy single function
npx supabase functions deploy generate-tasks

# Deploy all functions
npx supabase functions deploy

# Set secrets
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```
