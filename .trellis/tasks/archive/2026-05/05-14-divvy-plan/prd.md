# Divvy — Implementation Plan (Vibecode PRD)

## Goal

Xây dựng Divvy — mobile app chia việc nhà và chăm thú cưng theo phong cách vibecode: từng giai đoạn nhỏ, luôn chạy được, commit thường xuyên. MVP hoàn chỉnh trong ~6 tuần trên môi trường Windows, implement pixel-perfect theo design Neumorphic đã có.

---

## Design System (Đã Xác Định — Neumorphic)

### Colors
| Token | Light | Dark |
|---|---|---|
| `--neu-bg` | `#E4E9F2` | `#262B3D` |
| `--neu-bg-2` | `#D9DFEC` | `#1E2231` |
| `--neu-light` | `rgba(255,255,255,0.95)` | `rgba(73,82,110,0.5)` |
| `--neu-dark` | `rgba(163,177,198,0.55)` | `rgba(8,10,18,0.55)` |
| `--neu-text-dark` | `#2D3454` | `#E8ECF8` |
| `--neu-text-mid` | `#737CA0` | `#9DA5C2` |
| `--neu-text-light` | `#A6AEC8` | `#5C6584` |
| `--neu-accent` | `#6C7CFF` (periwinkle) | same |
| `--neu-accent-2` | `#A78BFA` | same |

Accent options: `#6C7CFF` / `#FF8DA1` / `#7AD9C4` / `#FFB155` / `#A78BFA`

### Typography
- **Primary font:** Plus Jakarta Sans (700 weight cho headings)
- **Alt fonts:** Manrope, Sora, Nunito
- **Logo:** `divvy` lowercase, 44px, weight 700, letterSpacing -0.04em

### Shadow System (3 depth levels)
```
raised: 8px 8px 18px var(--neu-dark), -8px -8px 18px var(--neu-light)
inset:  inset 5px 5px 10px var(--neu-dark), inset -5px -5px 10px var(--neu-light)
accent: 6px 6px 14px rgba(78,93,209,.45), -6px -6px 14px var(--neu-light) + inner glow
```
Sizes: sm / md / lg

### Border Radius
- Cards: `28px`
- Inputs: `20px` (h=60)
- Buttons pill: `999px` (h=60 lg, h=52 md, h=44 sm)
- Small cards / tabs: `14-22px`
- Phone frame: `52px` outer, `42px` inner

### 23 Màn Hình (Flow Đầy Đủ)

**Onboarding (13 màn):**
1. Splash — logo + spinner 2.2s auto-advance
2. Welcome-0 — "Ngừng hỏi nhau. Mở app là biết." + house art
3. Welcome-1 — "Một cú tap. Cả nhà thấy ngay." + tap art
4. Welcome-2 — "Để Claude chia việc giúp bạn." + sparkle art
5. Phone — input SĐT hoặc Email (segmented toggle)
6. OTP — 6 ô inset → raised khi điền xong
7. Profile — tên + emoji avatar picker
8. Space type — "Nhà mình" 🏠 vs "Thú cưng" 🐾
9. Create Space — tên space + invite members
10. AI Prompt — textarea + sample prompts
11. AI Review — task list review (tap to reassign, × to remove)
12. Notifications — xin quyền
13. Done — mini home preview

**Main App (10 màn):**
14. Home/Today — greeting + progress card + task list
15. Task Detail — detail + complete/skip CTA
16. Skip/Cover Sheet — bottom sheet action
17. Add Task — form + AI shortcut
18. History 7d — timeline + streak
19. Members — leaderboard
20. Profile/Settings — theme tweaks + sign out
21. Notifications — inbox
22. Space Switcher — bottom sheet
23. Join Space — QR + code input

---

## Tech Stack (Đã Quyết Định)

| Layer | Technology |
|---|---|
| Frontend | React Native + Expo |
| Navigation | Expo Router |
| Styling | NativeWind (Tailwind cho RN) |
| State | Zustand |
| Auth | Supabase Auth (Phone OTP hoặc Email) |
| Database | Supabase Postgres |
| Realtime | Supabase Realtime |
| Edge Logic | Supabase Edge Functions (Deno) |
| AI | Anthropic Claude API (qua Edge Function) |
| Notifications | Expo Push Notifications |
| Build | EAS Build + EAS Update |
| Scheduled Jobs | pg_cron (overdue task check) |

---

## MVP Scope

### Chức Năng Đưa Vào MVP
- [ ] Auth: đăng ký / đăng nhập (Phone OTP hoặc Email)
- [ ] Spaces: tạo nhóm, invite qua link / QR code
- [ ] Tasks: tạo task (tên, emoji icon, tần suất daily/weekly/3xweek), assign member hoặc unassigned
- [ ] Task reset: tự reset theo tần suất sau khi tick (period_key logic)
- [ ] Tick & Shared View: tap 1 lần → realtime update cho cả nhóm
- [ ] History: lịch sử 7 ngày (ai làm gì, lúc mấy giờ)
- [ ] AI Task Generation: nhập text tự do → Claude sinh task list → user review → confirm
- [ ] Skip Task: bỏ qua lần này, task hiển thị unassigned cho group
- [ ] Notifications: nhắc task đến giờ + alert task quá hạn

### Chức Năng Ngoài MVP
- Request Cover với push notify (→ v1.1)
- Unavailable Mode / set vắng theo ngày (→ v1.2)
- Chia tiền, Widget, Gamification (→ v2.0)

---

## Database Schema

```sql
-- profiles (app-level user info)
profiles (
  id uuid references auth.users,
  display_name text,
  avatar_emoji text default '🌸',
  expo_push_token text,
  created_at timestamptz default now()
)

-- spaces
spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text default '🏠',
  invite_code text unique default substr(md5(random()::text), 1, 8),
  created_by uuid references profiles,
  created_at timestamptz default now()
)

-- space_members
space_members (
  space_id uuid references spaces,
  user_id uuid references profiles,
  role text default 'member', -- 'owner' | 'member'
  joined_at timestamptz default now(),
  primary key (space_id, user_id)
)

-- tasks
tasks (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces,
  name text not null,
  icon text default '✅',
  frequency text not null, -- 'daily' | 'weekly' | '3xweek' | '2xweek'
  assignee_id uuid references profiles, -- null = unassigned / ai-rotate
  created_by uuid references profiles,
  created_at timestamptz default now(),
  is_active boolean default true
)

-- task_completions (tick log)
task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks,
  completed_by uuid references profiles,
  completed_at timestamptz default now(),
  period_key text not null, -- 'YYYY-MM-DD' daily | 'YYYY-Www' weekly
  unique (task_id, period_key)
)

-- task_skips (báo bận MVP)
task_skips (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks,
  skipped_by uuid references profiles,
  skipped_at timestamptz default now(),
  period_key text not null
)
```

**RLS Policies:**
- Space members can only read/write tasks in their spaces
- Only the assignee (or any member for unassigned) can tick a task
- No cross-space data leaks

---

## AI Flow (Edge Function)

```
POST /functions/v1/generate-tasks
{
  spaceId: string,
  userPrompt: string,
  members: [{ id, name }]
}

→ Edge Function calls Claude API:
system: "You are a household task organizer. Return ONLY valid JSON array."
user: "Tasks: {userPrompt}\nMembers: {members}\nReturn: [{name,icon,frequency,assignee_id|'rotate'|null}]"

→ Claude returns JSON:
[
  { name: "Cho chó ăn sáng", icon: "🐶", frequency: "daily", assignee_id: "uuid-or-rotate" },
  ...
]

→ Client review → confirm → batch INSERT tasks
```

---

## NativeWind / Neumorphic Implementation Strategy

Neumorphic shadows trong React Native dùng `shadowColor` + `elevation` (Android) và `shadow*` props (iOS). NativeWind hỗ trợ custom CSS variables qua `tailwind.config.js`.

**Approach:**
- Tạo `useNeumorphic()` hook trả về style objects (raised/inset/accent) dựa trên theme (light/dark)
- Dùng `StyleSheet.create()` cho static shadows, hook cho dynamic (theme switch)
- Tránh `box-shadow` CSS (chỉ web) — dùng React Native shadow props + `elevation`

---

## Implementation Plan (6 Giai Đoạn)

### Giai Đoạn 1: Foundation (3–5 ngày)
**Deliverable:** App chạy được với Auth flow hoàn chỉnh

- [ ] `npx create-expo-app divvy --template expo-router`
- [ ] Cài: `nativewind`, `zustand`, `@supabase/supabase-js`, `expo-linear-gradient`
- [ ] Setup `tailwind.config.js` với custom colors từ design system
- [ ] Tạo `useTheme()` hook + `useNeumorphic()` shadow hook
- [ ] Supabase client setup + env vars
- [ ] Màn hình: Splash → Welcome carousel (3 slides) → Phone/OTP → Profile
- [ ] Supabase Auth: Phone OTP flow + Email fallback
- [ ] Store user profile vào `profiles` table
- [ ] Navigation: auth stack vs app stack (Expo Router)

### Giai Đoạn 2: Spaces (3–5 ngày)
**Deliverable:** Có thể tạo Space và invite người khác join

- [ ] Space type selection screen (🏠 / 🐾)
- [ ] Create Space form (tên + emoji)
- [ ] Add initial members (tên + emoji)
- [ ] Generate invite_code + deeplink: `divvy://join/{code}`
- [ ] QR code generation (`react-native-qrcode-svg`)
- [ ] Join Space via code + deeplink handling
- [ ] Space switcher bottom sheet
- [ ] Space list trong profile

### Giai Đoạn 3: Tasks + Realtime (1 tuần)
**Deliverable:** Tick task realtime giữa 2 thiết bị

- [ ] Add Task form (tên, emoji picker, frequency, assignee)
- [ ] Task list trong Home screen
- [ ] Tick task → INSERT task_completion với period_key
- [ ] Task hiển thị done state (tên + giờ người tick)
- [ ] Supabase Realtime: subscribe to `task_completions` → update UI
- [ ] Task auto-reset: derived từ completions (không xóa record)
- [ ] Skip task (long-press → bottom sheet → skip)
- [ ] Task detail screen
- [ ] History 7 ngày screen

### Giai Đoạn 4: AI Task Generation (3–4 ngày)
**Deliverable:** Generate task list từ text tự do, review và save

- [ ] AI Prompt screen với textarea + sample prompts
- [ ] Supabase Edge Function: `generate-tasks`
- [ ] Claude API integration trong Edge Function
- [ ] Parse + validate JSON response từ Claude
- [ ] AI Review screen: tap to cycle assignee, × to remove, ✓ to confirm
- [ ] Batch INSERT confirmed tasks vào database

### Giai Đoạn 5: Notifications (3–4 ngày)
**Deliverable:** Push notify khi task quá hạn

- [ ] Notification permission screen (onboarding)
- [ ] Expo Push Token registration → lưu vào profiles
- [ ] pg_cron job: check task overdue mỗi 30 phút
- [ ] Edge Function: `send-push-notification`
- [ ] Notification tap → deep link vào task
- [ ] Notifications inbox screen

### Giai Đoạn 6: Polish + Beta (1 tuần)
**Deliverable:** App sẵn sàng TestFlight / Play Store Internal

- [ ] Dark mode toggle (từ Profile/Settings)
- [ ] Accent color picker (5 options)
- [ ] Font picker (4 options)
- [ ] Loading states + skeleton screens
- [ ] Empty states (no tasks, no history)
- [ ] Error handling + retry logic
- [ ] Haptic feedback khi tick
- [ ] EAS Build configuration
- [ ] TestFlight (iOS) + Play Store Internal Testing (Android)

---

## Acceptance Criteria (MVP Done)

- [ ] Hai người dùng khác nhau cùng vào một Space, tick task, thấy update trong <2 giây
- [ ] AI generate task list từ text tự do (tiếng Việt), user review và save thành công
- [ ] Task tự reset đúng sau period (daily reset lúc 0:00, weekly reset thứ 2)
- [ ] Skip task hoạt động: task hiển thị unassigned, người khác có thể tick
- [ ] Push notification đến khi task quá hạn >2 giờ
- [ ] App chạy không crash trên Android Emulator và Expo Go (iOS)
- [ ] Dark mode và accent color switch hoạt động đúng

---

## Definition of Done

- TypeScript không có `any` explicit
- No ESLint errors
- Tested trên Android Emulator + Expo Go (iPhone)
- EAS Build thành công (ít nhất Android)
- Không có crash trên happy path

---

## Technical Notes

- **Môi trường dev**: Windows, VSCode, Android Studio Emulator, Expo Go trên iPhone thật
- **EAS Build**: build trên cloud — không cần Mac thường xuyên
- **pg_cron**: enable trong Supabase Dashboard → Database → Extensions
- **Supabase Secrets**: ANTHROPIC_API_KEY lưu trong Vault
- **period_key**: `YYYY-MM-DD` cho daily, `YYYY-Www` cho weekly (ISO week)
- **React Native shadows**: iOS dùng `shadow*` props, Android dùng `elevation` — wrap trong `useNeumorphic()` hook
- **Design reference**: 23 screens prototype tại `divvy/project/` trong bundle đã extract

## Research References

*(Sẽ bổ sung sau khi nghiên cứu best practices)*
