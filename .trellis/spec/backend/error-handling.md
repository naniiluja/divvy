# Backend Error Handling

## Error Response Format

All Edge Functions return this shape on error:

```json
{ "error": "Human-readable error message" }
```

HTTP status codes:
- `400` — bad request (missing fields, validation failure)
- `401` — unauthorized (no valid JWT, wrong service role key)
- `403` — forbidden (valid JWT but no permission — RLS violation)
- `404` — resource not found
- `500` — internal server error (Claude API failure, Supabase error, unexpected exception)

## Edge Function Error Pattern

```ts
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate input
    const body = await req.json().catch(() => null)
    if (!body?.input) {
      return Response.json({ error: 'Missing required field: input' }, { status: 400, headers: corsHeaders })
    }

    // Business logic
    const result = await doWork(body)

    return Response.json(result, { headers: corsHeaders })
  } catch (error) {
    // Log for Supabase dashboard visibility
    console.error('[function-name]', error)

    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
})
```

## Supabase Client Error Handling

```ts
const { data, error } = await supabase.from('tasks').select('*')
if (error) {
  // Do not throw — return structured error response
  return Response.json({ error: error.message }, { status: 500, headers: corsHeaders })
}
```

## Claude API Error Handling

```ts
try {
  const message = await client.messages.create({ ... })
  const content = message.content[0]

  if (content.type !== 'text') {
    throw new Error('Claude returned non-text response')
  }

  // JSON.parse can throw — must be caught
  const tasks = JSON.parse(content.text)
  return tasks
} catch (e) {
  if (e instanceof Anthropic.APIError) {
    console.error('Anthropic API error:', e.status, e.message)
    throw new Error(`AI service unavailable: ${e.message}`)
  }
  throw e
}
```

## Forbidden Patterns

- Never return raw Supabase error objects to the client — they can leak schema details.
- Never swallow errors silently — always log with `console.error` at minimum.
- Never expose `ANTHROPIC_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in error responses.
