# Logging Guidelines

Supabase Edge Functions use Deno's built-in `console` methods. Logs appear in the Supabase dashboard under Functions → Logs.

## Log Levels

```ts
console.log('[function-name] info message')     // routine events
console.warn('[function-name] warning message') // recoverable issues
console.error('[function-name] error message', error) // failures
```

## What to Log

```ts
// Function entry with sanitized input shape
console.log('[generate-tasks] called', { memberCount: members.length, inputLength: input.length })

// External API calls
console.log('[generate-tasks] calling Claude API')

// Successful outcomes
console.log('[generate-tasks] generated', tasks.length, 'tasks')

// All errors with context
console.error('[generate-tasks] Claude API error', { status: e.status, message: e.message })
```

## What NOT to Log

- User's free-text input (may contain personal info)
- Member names or user IDs
- API keys, tokens, secrets
- Full request/response bodies with potential PII

## Log Format

Prefix every log with `[function-name]` for easy filtering in Supabase dashboard:

```ts
// Correct
console.error('[generate-tasks] JSON parse failed:', e.message)

// Wrong — hard to filter
console.error('Something went wrong')
```
