# Security Research — Divvy Stack

- **Query**: Security audit for React Native (Expo SDK 54) + Supabase (Auth, Postgres RLS, Realtime, Edge Functions)
- **Scope**: Internal (codebase + spec) + External (best practices)
- **Date**: 2026-05-14

---

## Gaps in Current Spec

### 1. Session Token Storage — AsyncStorage (Not Encrypted)

**File**: `lib/supabase.ts` line 9; `stores/index.ts` lines 22–49; `.trellis/spec/frontend/state-management.md`

The Supabase client persists the JWT session to `AsyncStorage` (unencrypted), and Zustand also persists `session` and `activeSpaceId` to `AsyncStorage` via `createJSONStorage(() => AsyncStorage)`.

`expo-secure-store` is installed (listed in `app.json` plugins line 36) but **never used**. The spec documents AsyncStorage explicitly as the storage adapter for both Zustand and Supabase auth — no mention of SecureStore anywhere.

**Risk**: On rooted Android or jailbroken iOS devices, `AsyncStorage` contents are readable as plaintext from the filesystem. JWT tokens stored there can be extracted without app-level exploits.

**What spec is missing**: No mention of SecureStore as the required adapter for the Supabase client. No rule forbidding AsyncStorage for session/token storage. No guidance on the `LargeSecureStore` pattern needed to work around SecureStore's 2 KB limit.

---

### 2. Invite Link Validation — Client-Side Only, No Server Enforcement

**Files**: `lib/api.ts` lines 119–128 (`getInviteLinkByToken`); `app/(app)/space/invite/[id].tsx`; `database-guidelines.md` `invite_links` schema

`getInviteLinkByToken` fetches the invite row from Supabase including `expires_at` and related `spaces` data, but there is **no check in the client code** that `expires_at > now()` before proceeding to join. The spec notes `invite_links.token` should have a short expiry, but the enforcement is left to RLS or the caller — neither is explicitly specified.

In `getOrCreateInviteLink` (api.ts line 106), expiry is set to 7 days. However, the `invite_links` schema in `database-guidelines.md` allows `expires_at` to be NULL.

**What spec is missing**: RLS policy for `invite_links` table is not documented. No rule enforcing token expiry check at join-time. No single-use token pattern documented. No policy on NULL `expires_at`.

---

### 3. CORS Origin Is Wildcard `*` in Edge Functions

**File**: `.trellis/spec/backend/edge-functions.md` lines 14–19

The shared CORS helper sets `'Access-Control-Allow-Origin': '*'`. This means any origin can call the Edge Functions. For `generate-tasks`, which proxies Claude AI and has no rate limiting documented, any web client with a valid Supabase JWT can trigger Claude calls at the project's expense.

**What spec is missing**: No rate-limiting strategy for Edge Functions. No mention of restricting CORS origins in production. No per-user or per-space call quotas for the Claude API proxy.

---

### 4. `reset-tasks` Authorization Check Is Weak (String Inclusion, Not Signature)

**File**: `.trellis/spec/backend/edge-functions.md` lines 129–131

The `reset-tasks` function authenticates the caller by checking `authHeader?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)`. Using `.includes()` rather than constant-time comparison (`timingSafeEqual`) makes this slightly vulnerable to timing attacks, though this is a low-risk concern since the service role key is 64+ chars. More critically, if the service role key is ever rotated, this logic must be updated manually — no abstraction exists.

**What spec is missing**: No note about using a dedicated shared secret (separate from the service role key) for internal cron-to-function calls. No mention of timing-safe comparison.

---

### 5. `useSession` Uses `getSession()` — Returns Cached (Potentially Stale) Data

**File**: `hooks/useSession.ts` lines 15–17

On initial load, `useSession` calls `supabase.auth.getSession()`. Per Supabase documentation, `getSession()` returns the session **from local storage** without re-validating the JWT with the server. A revoked or expired token can still be returned as valid until `onAuthStateChange` fires or the token TTL expires.

The more secure alternative is `supabase.auth.getUser()`, which validates the JWT with the Supabase Auth server on every call.

`profile-setup.tsx` line 28 does use `supabase.auth.getUser()` correctly. The inconsistency between screens is undocumented.

**What spec is missing**: No rule specifying when to use `getSession()` vs `getUser()`. No note about `getSession()` returning unvalidated cached data. No recommendation to call `getUser()` at the auth guard level.

---

### 6. Deep Link Scheme `divvy://` — No Handler Validation Documented

**Files**: `app.json` line 11 (`"scheme": "divvy"`); `navigation.md` lines 69–71; `app/(app)/space/invite/[id].tsx` line 37

The invite URL format is `divvy://join/<token>`. The navigation spec documents the handler screen but does not specify:
- Validation that the `token` param is not empty before calling the API
- Rate limiting or throttling for repeated join attempts with invalid tokens
- Protection against deep link hijacking (another app registering the `divvy://` scheme on Android)

**What spec is missing**: No security guidance for deep link handling. No note about Android deep link hijacking risk. No validation rules for URL params before API calls.

---

### 7. Supabase Anon/Publishable Key in `.env` — Committed Pattern Undefined

**Files**: `.env` (contains live keys), `.gitignore` (`.env` is listed as ignored), `.env.example`

`.env` is correctly gitignored. However, the `.env` file in the working tree contains the actual Supabase project URL and publishable key (`sb_publishable_EFjZqKANodjT_OI3PqDAJA_O6kXfKTQ`). Because `EXPO_PUBLIC_` prefix is used, these values are **bundled into the JavaScript bundle** and visible in production builds via reverse engineering or Metro bundle inspection — this is expected behavior for anon/publishable keys, but the spec has no note clarifying which keys are safe to expose (anon) vs which are never safe (service role).

**What spec is missing**: No explicit note that `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the anon key and is intentionally public (client-safe). No rule distinguishing service role key handling from anon key handling in the frontend context.

---

### 8. No RLS Policy Documented for `profiles` Table

**File**: `.trellis/spec/backend/database-guidelines.md` lines 77–100

RLS policies are documented only for `tasks` (SELECT + INSERT examples). The `profiles` table has no RLS policy example documented. This is significant because `profiles` stores `display_name` and `avatar_url` — data that may be readable by other users in a space (for member lists), but the exact read/write scope is not defined in spec.

**What spec is missing**: RLS policies for `profiles`, `spaces`, `space_members`, `invite_links` tables. The spec says "same pattern applies" but provides no concrete policies for these tables.

---

### 9. `generate-tasks` — No Authentication Check on the Edge Function

**File**: `.trellis/spec/backend/edge-functions.md` lines 43–110

The `generate-tasks` function spec shows no verification that the incoming request has a valid JWT. The spec says "always use caller's JWT for RLS", but the function code in the spec does not actually extract or validate the JWT — it only creates an Anthropic client and calls Claude. Any request with a valid `apikey` header (the anon key) can trigger Claude API calls without being an authenticated user.

**What spec is missing**: No rule requiring JWT verification before expensive operations (Claude API calls). No documented pattern for `supabase.auth.getUser()` inside Edge Functions to verify the caller is authenticated.

---

### 10. Realtime Channel — No Row-Level Authorization on Subscription Filter

**File**: `hooks/useTasks.ts` lines 33–51

The Realtime subscription filters on `space_id=eq.${spaceId}`. However, there is no client-side validation that the authenticated user is actually a member of `spaceId` before subscribing. RLS on the `task_completions` table would prevent the user from *receiving* events they shouldn't see at the database level (if Realtime respects RLS — which it does for Supabase Realtime with RLS enabled), but the spec does not document this expectation.

**What spec is missing**: No documentation confirming Realtime is configured to respect RLS policies. No note about enabling "Realtime with RLS" in the Supabase dashboard setting.

---

## Critical Issues Found

| # | Issue | Severity | File(s) |
|---|-------|----------|---------|
| 1 | Session JWT stored in unencrypted AsyncStorage; SecureStore installed but unused | HIGH | `lib/supabase.ts`, `stores/index.ts` |
| 2 | `generate-tasks` Edge Function has no JWT authentication check | HIGH | `edge-functions.md` (spec + implementation) |
| 3 | `getSession()` used at auth guard — returns unvalidated cached JWT | MEDIUM | `hooks/useSession.ts` |
| 4 | Invite token expiry not validated client-side before join | MEDIUM | `lib/api.ts`, `app/(app)/space/invite/[id].tsx` |
| 5 | Deep link `divvy://` scheme has no hijack protection or param validation | MEDIUM | `app.json`, navigation.md |
| 6 | RLS policies for `profiles`, `spaces`, `space_members`, `invite_links` undocumented | MEDIUM | `database-guidelines.md` |
| 7 | CORS `*` on Edge Functions + no rate limiting for Claude API proxy | LOW-MEDIUM | `edge-functions.md` |
| 8 | `reset-tasks` uses string `.includes()` to check service role key | LOW | `edge-functions.md` |

---

## Recommendations for New `security-guidelines.md` Spec

A new file `.trellis/spec/backend/security-guidelines.md` (and possibly `.trellis/spec/frontend/security-guidelines.md`) should codify the following:

### Frontend Security Rules

1. **Token Storage**: Use `expo-secure-store` (not `AsyncStorage`) for session JWT persistence. Implement the `LargeSecureStore` chunking pattern since SecureStore has a 2 KB per-entry limit and Supabase sessions can exceed this. Pass the SecureStore adapter to both the Supabase client (`auth.storage`) and Zustand persist middleware.

2. **Session Validation**: Use `supabase.auth.getUser()` (server-validated) at the `(app)/_layout.tsx` auth guard level. Reserve `getSession()` for non-security-critical reads (e.g., getting the user ID for display purposes after the guard has confirmed validity).

3. **Deep Link Safety**: Validate all URL params (token, spaceId) are non-empty and match expected format (UUID, hex string) before making API calls in deep link handlers. Document the Android deep link hijacking risk and note that iOS Universal Links (`https://`) are more secure than custom schemes.

4. **Env Key Clarity**: Add a comment in `lib/supabase.ts` and in the spec explaining that `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the anon key (public by design). Explicitly document that `SUPABASE_SERVICE_ROLE_KEY` must never appear in any `EXPO_PUBLIC_` variable or client bundle.

### Backend Security Rules

5. **Edge Function Authentication**: Every user-facing Edge Function must extract the `Authorization` header and call `supabase.auth.getUser(jwt)` before performing any action. Reject with 401 if the user is not authenticated. The `generate-tasks` function must implement this.

6. **RLS Completeness**: Document explicit RLS policies for all tables: `profiles` (users can read any profile in their spaces; can only write their own profile), `spaces` (only members can read), `space_members` (only members of the space can read), `invite_links` (only space members can read; expires_at must not be NULL).

7. **Invite Link Security**: `expires_at` must be NOT NULL in schema. Add an RLS policy that includes `expires_at > now()` in the `invite_links` SELECT policy so expired tokens are invisible. Document single-use pattern as v1.1 enhancement.

8. **Rate Limiting for Claude Proxy**: Document a Supabase rate-limiting strategy for `generate-tasks` (e.g., max 5 calls per user per hour via a `rate_limits` table or Supabase's built-in function rate limiting). This prevents cost abuse even by authenticated users.

9. **Realtime + RLS**: Confirm and document that `task_completions` Realtime publication uses RLS (`supabase_realtime` publication with RLS check enabled). Add to the quality checklist: "Realtime channel only subscribes after confirming user is a member of the space."

10. **CORS Tightening for Production**: Document that `Access-Control-Allow-Origin: *` is acceptable for MVP but should be tightened to the app's domain (or the Expo app scheme) in production.

---

## Sources

### Internal Files Analyzed

| File | Key Finding |
|------|------------|
| `lib/supabase.ts` | AsyncStorage used for session persistence; SecureStore not used despite being installed |
| `stores/index.ts` (spec) | Zustand `persist` also uses AsyncStorage; session token persisted unencrypted |
| `hooks/useSession.ts` | `getSession()` used (cached, unvalidated) rather than `getUser()` |
| `lib/api.ts` | `getInviteLinkByToken` fetches without expiry check; `getOrCreateInviteLink` sets 7-day expiry |
| `app/(app)/space/invite/[id].tsx` | Deep link handler exists; no param validation before API call |
| `app.json` | `expo-secure-store` installed in plugins; custom scheme `divvy://` registered |
| `.trellis/spec/backend/edge-functions.md` | `generate-tasks` has no JWT auth check; CORS is `*`; `reset-tasks` uses `.includes()` |
| `.trellis/spec/backend/database-guidelines.md` | RLS only documented for `tasks`; `invite_links` has nullable `expires_at` |
| `.trellis/spec/backend/quality-guidelines.md` | Has a security checklist — good foundation but missing items above |
| `.gitignore` | `.env` correctly ignored |
| `.env` | Live publishable key present; correctly an anon key (public by design) |

### External References

- [Supabase Auth — getSession() vs getUser()](https://supabase.com/docs/reference/javascript/auth-getsession) — `getSession()` reads from local storage; `getUser()` validates with server. Use `getUser()` for security-sensitive operations.
- [Supabase RLS — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — All tables need SELECT/INSERT/UPDATE/DELETE policies; missing policies default to DENY (good) but unverified coverage creates audit gaps.
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) — Encrypted key-value storage backed by iOS Keychain / Android Keystore. 2 KB limit per entry requires LargeSecureStore chunking for Supabase sessions.
- [Supabase + SecureStore in React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native) — Official guide recommends `ExpoSecureStoreAdapter` pattern for the `storage` option.
- [Expo Deep Links Security](https://docs.expo.dev/guides/linking/) — Custom URI schemes are not guaranteed unique on Android; HTTPS Universal Links are recommended for security-sensitive flows (e.g., invite links).
- [Supabase Realtime + RLS](https://supabase.com/docs/guides/realtime/postgres-changes) — RLS policies are enforced on Realtime changes when the client is authenticated with a user JWT.
- [Supabase Edge Functions Auth](https://supabase.com/docs/guides/functions/auth) — Pattern: extract Bearer token from `Authorization` header, call `supabase.auth.getUser(token)` to verify before processing.
