# Divvy — App Overview

**Tagline:** *"Stop asking. Just check."*

Mobile app for households and roommates to share and track recurring chores in realtime.

---

## MVP Scope (do not exceed this)

**2 use cases only:**
1. Household chore sharing (trash, cooking, dishes, cleaning)
2. Pet care sharing (feeding, walking, bathing, medicine)

**In MVP:**
- Spaces (groups) with invite via link/QR
- Tasks with name, emoji icon, frequency (daily/weekly/3x_week), optional assignee
- AI task generation from free-text via Claude Haiku → Edge Function
- One-tap tick with realtime sync (name + time visible to all members)
- 7-day history
- Skip task (báo bận MVP — unassign this occurrence, task stays visible)
- Push notifications (reminder + overdue alert)

**NOT in MVP (defer):**
- Request Cover (v1.1)
- Unavailable Mode (v1.2)
- Bill splitting, widgets, gamification, rotation automation (v2.0)

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.78 + Expo SDK 54 |
| Routing | Expo Router v4 (bundled with SDK 54) |
| Styling | NativeWind v4 (Tailwind v3) |
| State | Zustand v5 (session + active space only) |
| Database | Supabase Postgres |
| Auth | Supabase Auth (Phone OTP or Email) |
| Realtime | Supabase Realtime (task_completions table) |
| AI | Anthropic Claude Haiku via Supabase Edge Function |
| Notifications | Expo Push Notifications |
| Build | EAS Build + EAS Update |
| Dev env | Windows + VSCode + Android Emulator (daily). iOS → EAS Dev Build |

---

## Domain Entities

```
Space     — named group (e.g., "Nhà mình", "Chó Max")
Member    — user who belongs to a Space
Task      — recurring chore with frequency and optional assignee
TaskCompletion — record of tick or skip with timestamp and actor
InviteLink — time-limited token for joining a Space
```

---

## AI Flow

```
App → Supabase Edge Function (generate-tasks)
     → Claude Haiku API
     → JSON task list
     → User reviews + confirms
     → Saved to Supabase Postgres
```

Claude model: `claude-haiku-4-5-20251001` (fast, cheap, good at structured JSON).

---

## Timeline

| Phase | Duration |
|-------|----------|
| Setup + Auth + Database | 3–5 days |
| Spaces + Invite | 3–5 days |
| Tasks + Realtime tick | 1 week |
| AI Task Generation | 3–4 days |
| Skip Task | 1–2 days |
| Notifications | 3–4 days |
| UI polish + TestFlight | 1 week |
| **Total** | **~6 weeks** |
