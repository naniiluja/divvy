# Backend Quality Guidelines

## Forbidden Patterns

| Pattern | Why | Alternative |
|---------|-----|-------------|
| Direct Anthropic call from React Native app | Exposes `ANTHROPIC_API_KEY` to client | Call via Supabase Edge Function |
| `supabase.from().select('*')` without RLS | RLS must exist first | Enable RLS, then query |
| Hardcoded secrets in Edge Functions | Security violation | `Deno.env.get('KEY')` |
| `supabase_service_role` key in client app | Full database access from client | Never expose service role key |
| Migration without RLS policy | Table open to all | Add RLS policies in same migration |
| Raw Supabase errors returned to client | Schema leakage | Wrap in `{ error: message }` |
| `JSON.parse` without try/catch | Crashes on invalid Claude response | Wrap in try/catch |

## Required Patterns

- Every new table migration includes: `alter table ... enable row level security` + at minimum a SELECT policy.
- Edge Functions: always handle OPTIONS preflight for CORS.
- Edge Functions: validate request body before processing.
- Edge Functions: use caller JWT for user-facing functions, service role only for system functions (pg_cron).
- `generate-tasks`: validate that `members` array is non-empty before calling Claude.

## Security Checklist

- [ ] `ANTHROPIC_API_KEY` is in Supabase Secrets only
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never referenced in client app code
- [ ] `invite_links.token` has a short expiry (`expires_at`) or is single-use
- [ ] RLS policies use `(select auth.uid())` not `auth.uid()` (performance: avoids re-evaluation per row)
- [ ] No phone numbers or email addresses stored in public-accessible tables without RLS

## Claude API Usage

- Model for task generation: `claude-haiku-4-5-20251001` — fast and cheap for structured JSON output.
- Max tokens: 1024 (task lists are small).
- Prompt must ask for JSON-only output (no markdown fences).
- Always validate parsed JSON shape before returning to client.
