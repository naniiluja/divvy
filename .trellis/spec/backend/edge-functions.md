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
  // Dùng timing-safe comparison để tránh timing attack
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

# Set secrets — dùng Vault thay vì CLI (xem bên dưới)
```

## Secrets Management — Vault Pattern (Ưu Tiên Hơn CLI)

Supabase CLI `secrets set` yêu cầu authenticated session. Thay vào đó, dùng **Vault** qua MCP SQL — không cần CLI login.

### Lưu secret vào Vault

```sql
-- Dùng MCP execute_sql
SELECT vault.create_secret('sk-...', 'KEY_NAME', 'Description');
```

### Đọc secret trong Edge Function

```ts
let cachedApiKey: string | null = null

async function getSecret(name: string): Promise<string> {
  if (cachedApiKey) return cachedApiKey

  // Fallback: try Deno.env first (nếu set qua CLI)
  const envKey = Deno.env.get(name)
  if (envKey) { cachedApiKey = envKey; return envKey }

  // Read từ vault bằng service role
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const { data, error } = await supabase
    .schema('vault')
    .from('decrypted_secrets')
    .select('decrypted_secret')
    .eq('name', name)
    .single()

  if (error || !data?.decrypted_secret) throw new Error(`${name} not found in vault`)
  cachedApiKey = data.decrypted_secret
  return cachedApiKey
}
```

**Tại sao cache**: Vault query có latency ~50ms — module-level cache giảm cold start.

### Rotate secret

```sql
UPDATE vault.secrets SET secret = 'new-key' WHERE name = 'KEY_NAME';
```

## Scenario: AI Task Generation — MiniMax M2.7 Endpoint

### 1. Scope / Trigger

`generate-tasks` edge function gọi **MiniMax M2.7** qua Anthropic-compatible endpoint để gen JSON task array. Trigger code-spec depth: cross-layer contract (client → edge → external LLM), schema validation, env wiring.

### 2. Signatures

```
Endpoint: POST https://api.minimax.io/anthropic/v1/messages
Edge:     POST <SUPABASE_URL>/functions/v1/generate-tasks
Client:   supabase.functions.invoke('generate-tasks', { body })
```

### 3. Contracts

**Endpoint & Auth (CRITICAL — header type)**

```
URL:     https://api.minimax.io/anthropic/v1/messages
Header:  Authorization: Bearer <MINIMAX_API_KEY>   ← NOT "x-api-key"
Header:  anthropic-version: 2023-06-01
Model:   MiniMax-M2.7
```

**Edge request/response**

```ts
// Request
interface GenerateTasksRequest {
  input: string                                          // free-text from user
  members: { id: string; display_name: string }[]        // ≥1 required
}

// Response (success)
interface GenerateTasksResponse {
  tasks: GeneratedTask[]
  strategy: 'output_config' | 'tool_use' | 'prefill'    // debugging aid
}

interface GeneratedTask {
  name: string                                           // Vietnamese
  icon: string                                           // single emoji
  frequency: 'daily' | 'weekly' | '3x_week'
  assignee_display_name: string | null                   // member.display_name or null
}

// Response (error)
interface GenerateTasksError { error: string }
```

**Environment keys**

| Key | Source | Required |
|---|---|---|
| `MINIMAX_API_KEY` | Vault (secret name) | yes |
| `SUPABASE_URL` | runtime | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | runtime | yes (for vault read) |

### 4. Validation & Error Matrix

| Condition | Status | Error |
|---|---|---|
| `input` empty or `members` length 0 | 400 | `'input and members are required'` |
| MiniMax non-2xx | 500 | `MiniMax API error <status>: <body preview>` |
| Response not JSON | 500 | `MiniMax returned non-JSON: <preview>` |
| All 3 strategies fail | 500 | `Failed to parse task JSON: <reason>` |
| Strategy returns empty array | 500 | `LLM returned empty task list` |

### 5. Good / Base / Bad Cases

- **Good**: Strategy A (`output_config.json_schema`) succeeds → `parsed_output.tasks` validated, returns immediately
- **Base**: Strategy A unsupported on MiniMax → falls back to Strategy B (`tool_use` forced) → succeeds with `content[].type === 'tool_use'`
- **Bad**: Both A and B fail → Strategy C (`assistant: '['` prefill) extracts text, slice from `[` to `]`, parse

### 6. Tests Required

- Unit: `extractParsedOutput`, `extractToolUseInput`, `extractTextFromResponse`, `parseJsonArrayFromText` — assert returns expected shape from sample MiniMax responses
- Integration: full edge call with mock MiniMax server returning each shape (parsed_output → tool_use → text) — assert strategy chain works
- E2E: real MiniMax call from emulator — assert tasks have valid `frequency` enum + non-empty `name`/`icon`

### 7. Structured Output — Triple Strategy Chain

Edge function tries 3 strategies in order, returns first success.

#### Strategy A: `output_config.json_schema` (most reliable when supported)

```ts
const body = {
  model: 'MiniMax-M2.7',
  max_tokens: 4096,
  messages: [{ role: 'user', content: prompt }],
  output_config: {
    format: {
      type: 'json_schema',
      schema: TASK_SCHEMA,            // JSON Schema with type/properties/required
    },
  },
}
// Response: data.parsed_output = { tasks: [...] }   ← already validated
```

#### Strategy B: Tool Use forced (fallback 1)

```ts
const body = {
  model: 'MiniMax-M2.7',
  max_tokens: 4096,
  tools: [{ name: 'save_tasks', description: '...', input_schema: TASK_SCHEMA }],
  tool_choice: { type: 'tool', name: 'save_tasks' },   // FORCE tool call
  messages: [{ role: 'user', content: prompt + '\n\nCall save_tasks with the list.' }],
}
// Response: data.content[].type === 'tool_use', .input = { tasks: [...] }
```

#### Strategy C: Assistant Prefill `[` (last resort)

```ts
const body = {
  model: 'MiniMax-M2.7',
  max_tokens: 4096,
  messages: [
    { role: 'user', content: `... Return ONLY a JSON array ...` },
    { role: 'assistant', content: '[' },              // ← FORCE response to start with [
  ],
}
// Response text won't include leading `[` — prepend it before parsing
const fullText = text.trim().startsWith('[') ? text : '[' + text
```

### Wrong vs Correct

#### Wrong: x-api-key header

```ts
// ❌ MiniMax Anthropic-compat returns 401
headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
```

#### Correct: Bearer authorization

```ts
// ✅ MiniMax requires Bearer auth despite Anthropic-compat endpoint
headers: { 'Authorization': `Bearer ${apiKey}`, 'anthropic-version': '2023-06-01' }
```

#### Wrong: only look for `type: 'text'` blocks

```ts
// ❌ Reasoning models (M2.7) return content blocks WITHOUT a `type` field:
//    [{ thinking: '...reasoning text...' }]
// Looking for type==='text' returns null → 'No JSON array found'
const textBlock = data.content?.find((b) => b.type === 'text')
```

#### Correct: fallback chain across all known shapes

```ts
// ✅ Try text → any-block-with-.text → thinking-as-last-resort
const textBlock = blocks.find((b) => b.type === 'text' && typeof b.text === 'string')
if (textBlock) return textBlock.text
const anyText = blocks.find((b) => typeof b.text === 'string' && b.text.trim())
if (anyText) return anyText.text
const thinking = [...blocks].reverse().find((b) => typeof b.thinking === 'string')
if (thinking) return thinking.thinking
```

### Common Mistake: `max_tokens` too low for reasoning models

**Symptom**: M2.7 response truncated mid-sentence, JSON array incomplete (only `[` or first task), `parseJsonArrayFromText` throws.

**Cause**: Reasoning models consume tokens in `thinking` blocks BEFORE producing the answer. `max_tokens: 1024` exhausts on thinking alone.

**Fix**: Set `max_tokens: 4096` minimum for M2.7. For Strategy A (`output_config`), reasoning is gated by `parsed_output` validation so it still needs headroom.

**Prevention**: Watch for response with `stop_reason: 'max_tokens'` in logs.

### Gotcha: Vault decrypt access path

> **Warning**: `supabase.schema('vault').from('decrypted_secrets')` does NOT work — `decrypted_secrets` view requires direct SQL `select` permission. Use RPC `get_vault_secret(secret_name)` instead.

```ts
// ✅ Working pattern in production
const { data, error } = await supabase.rpc('get_vault_secret', {
  secret_name: 'MINIMAX_API_KEY',
})
```
