# Security Guidelines

## Frontend

### 1. Session Storage — SecureStore (NOT AsyncStorage)

Supabase client phải dùng `LargeSecureStore` adapter (chunking pattern) vì SecureStore giới hạn 2 KB/entry:

```ts
// lib/supabase.ts — LargeSecureStore pattern
import * as SecureStore from 'expo-secure-store'

const CHUNK_SIZE = 1900
const LargeSecureStore = {
  getItem: async (key) => { /* chunk reassembly */ },
  setItem: async (key, value) => { /* chunk splitting */ },
  removeItem: async (key) => { /* chunk cleanup */ },
}

export const supabase = createClient(url, key, {
  auth: { storage: LargeSecureStore, ... }
})
```

**Forbidden**: `AsyncStorage` cho session/token storage — plaintext trên filesystem, readable trên rooted device.

Zustand `persist` chỉ được persist `activeSpaceId` — **không bao giờ persist `session`** (Supabase client đã tự handle qua SecureStore).

---

### 2. `getUser()` vs `getSession()`

| Hàm | Hành vi | Dùng khi nào |
|-----|---------|-------------|
| `supabase.auth.getUser()` | Validate JWT với server | Auth guard `(app)/_layout.tsx` |
| `supabase.auth.getSession()` | Đọc từ storage, không validate | Lấy user ID sau khi guard đã xác nhận |

**Pattern đúng tại auth guard:**
```ts
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) { redirect to auth }
```

**Forbidden**: Dùng `getSession()` tại auth gate — trả về cached JWT chưa validate, có thể đã bị revoke.

---

### 3. Deep Link Safety (`divvy://`)

- Validate token param: `token.length === 32` và `/^[a-f0-9]{32}$/.test(token)` trước khi gọi API
- Android: Custom URI scheme không đảm bảo unique — app khác có thể đăng ký `divvy://`. Trong v1.1 nên migrate sang HTTPS Universal Links.
- Không dùng token/spaceId từ URL params để skip auth check.

---

### 4. Env Key Clarity

```
EXPO_PUBLIC_SUPABASE_URL          — anon/publishable, an toàn bundle vào app
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY — anon key, intentionally public (read: limited perms + RLS)
SUPABASE_SERVICE_ROLE_KEY         — NEVER in EXPO_PUBLIC_, NEVER in client bundle
ANTHROPIC_API_KEY                 — NEVER in EXPO_PUBLIC_, chỉ dùng trong Edge Function
```

---

## Backend

### 5. Edge Function Authentication

Mọi user-facing Edge Function phải verify JWT trước khi thực hiện bất kỳ action nào:

```ts
// Pattern bắt buộc
const authHeader = req.headers.get('Authorization')
if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

const supabaseClient = createClient(url, anonKey, {
  global: { headers: { Authorization: authHeader } }
})
const { data: { user }, error } = await supabaseClient.auth.getUser()
if (error || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
```

**Áp dụng cho**: `generate-tasks`, mọi function expose cho client.
**Exception**: `reset-tasks` dùng service role key từ pg_cron — không có user JWT.

---

### 6. RLS — Tất Cả Bảng

```sql
-- profiles: đọc được tất cả (cần cho member list), chỉ tự sửa mình
create policy "users can read all profiles" on public.profiles
  for select using (true);
create policy "users can update own profile" on public.profiles
  for update using (id = auth.uid());
create policy "users can insert own profile" on public.profiles
  for insert with check (id = auth.uid());

-- spaces: chỉ member mới đọc được
create policy "members can read their spaces" on public.spaces
  for select using (
    id in (select space_id from space_members where user_id = auth.uid())
  );
create policy "authenticated can create space" on public.spaces
  for insert with check (auth.uid() is not null);
create policy "owner can update space" on public.spaces
  for update using (owner_id = auth.uid());

-- space_members: chỉ member trong space mới đọc được
create policy "members can read space_members" on public.space_members
  for select using (
    space_id in (select space_id from space_members where user_id = auth.uid())
  );
create policy "members can insert themselves" on public.space_members
  for insert with check (user_id = auth.uid());

-- invite_links: chỉ member + link chưa hết hạn
create policy "space members can read valid invite links" on public.invite_links
  for select using (
    exists (
      select 1 from space_members
      where space_id = invite_links.space_id and user_id = auth.uid()
    )
    and (expires_at is null or expires_at > now())
  );
```

---

### 7. Invite Link

- `expires_at` phải NOT NULL — không cho phép link vô thời hạn
- RLS SELECT policy bao gồm `expires_at > now()` — expired token invisible tại DB level
- Client code (`getInviteLinkByToken`) cũng filter `.gt('expires_at', now)` để double-check

---

### 8. Rate Limiting cho Claude Proxy (`generate-tasks`)

MVP: document limit nhưng chưa implement. V1.1 implement:
```sql
create table public.rate_limits (
  user_id uuid references auth.users(id),
  action  text,
  count   int default 1,
  window  timestamptz default date_trunc('hour', now()),
  primary key (user_id, action, window)
);
-- Max 5 generate-tasks calls per user per hour
```

Trong Edge Function: check trước khi gọi Claude API.

---

### 9. Realtime + RLS

- `task_completions` Realtime publication phải enable RLS check
- Confirm trong Supabase Dashboard: Database → Replication → `supabase_realtime` → RLS enabled
- Client chỉ subscribe sau khi confirm user là member của space: `useEffect` chạy sau `activeSpaceId` đã được set từ verified space membership

---

### 10. CORS

MVP: `Access-Control-Allow-Origin: *` acceptable.
Production (v1.0 release): tighten xuống Expo app bundle domain hoặc restrict bằng `req.headers.get('origin')` check.

---

### 11. Edge Function Secrets — Vault (Ưu Tiên)

Secrets cho Edge Functions nên lưu trong **Supabase Vault** (không phải plaintext env):

```sql
-- Lưu secret (dùng MCP SQL, không cần CLI login)
SELECT vault.create_secret('sk-...value...', 'SECRET_NAME', 'description');

-- Rotate secret
UPDATE vault.secrets SET secret = 'new-value' WHERE name = 'SECRET_NAME';
```

Edge Function đọc qua `vault.decrypted_secrets` view với service role client.

**Tại sao Vault tốt hơn CLI secrets**:
- Vault quản lý được qua MCP SQL — không cần `supabase login`
- Encrypted at rest bằng pgsodium
- Rotate không cần redeploy function
- Audit trail qua Postgres

Xem pattern chi tiết trong `edge-functions.md` → "Secrets Management — Vault Pattern".
