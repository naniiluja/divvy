# Backend Spec — Divvy

Stack: Supabase (Postgres + Auth + Realtime + Edge Functions), Deno runtime for Edge Functions, pg_cron for scheduled jobs.

---

## Pre-Development Checklist

Before writing any backend code:

- [ ] Does the table have RLS enabled? Every table must have RLS.
- [ ] Are you writing an Edge Function? It must use the caller's JWT (pass `Authorization` header to Supabase client) so RLS applies.
- [ ] Does this schema change need a migration file? Use `supabase migration new <name>`.
- [ ] Is `ANTHROPIC_API_KEY` accessed only via `Deno.env.get()`? Never hardcode, never expose to client.
- [ ] Does the Edge Function return CORS headers for OPTIONS preflight?
- [ ] Does the pg_cron job handle the case where no rows match gracefully?

---

## Quality Check

Before marking a task done:

- [ ] All tables have RLS policies covering SELECT / INSERT / UPDATE / DELETE
- [ ] Edge Functions return `{ error: string }` JSON with appropriate HTTP status on failure
- [ ] No secrets in client-accessible Supabase tables or Edge Function responses
- [ ] Realtime is enabled only on tables that need it (tasks, task_completions)
- [ ] Foreign keys have appropriate `ON DELETE` behavior (CASCADE vs RESTRICT)
- [ ] Indexes exist on columns used in WHERE / JOIN / ORDER BY

---

## Guidelines Index

| Guide | File |
|-------|------|
| Directory Structure | [directory-structure.md](./directory-structure.md) |
| Database Schema & RLS | [database-guidelines.md](./database-guidelines.md) |
| Edge Functions (Deno + Anthropic) | [edge-functions.md](./edge-functions.md) |
| Error Handling | [error-handling.md](./error-handling.md) |
| Quality & Forbidden Patterns | [quality-guidelines.md](./quality-guidelines.md) |
| Logging | [logging-guidelines.md](./logging-guidelines.md) |
