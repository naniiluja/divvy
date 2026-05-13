# Frontend Directory Structure

```
app/
├── _layout.tsx               # Root layout — wraps with providers (Zustand, SafeArea, NativeWind)
├── (auth)/                   # Unauthenticated routes — no session required
│   ├── _layout.tsx
│   ├── sign-in.tsx           # Phone OTP or email login
│   └── sign-up.tsx
├── (app)/                    # Authenticated routes — redirect to /sign-in if no session
│   ├── _layout.tsx           # Checks session, renders tabs
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Tab bar definition
│   │   ├── index.tsx         # Home — task list for active Space
│   │   ├── spaces.tsx        # Space switcher / join Space
│   │   └── profile.tsx       # User profile, sign out
│   ├── space/
│   │   ├── [id].tsx          # Space detail (tasks)
│   │   ├── new.tsx           # Create new Space
│   │   └── invite/[id].tsx   # QR / link invite screen
│   └── task/
│       ├── new.tsx           # Create task manually
│       └── ai-generate.tsx   # AI task generation flow
└── +not-found.tsx

components/
├── ui/                       # Generic, reusable primitives
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Avatar.tsx
│   ├── Badge.tsx
│   ├── BottomSheet.tsx
│   └── Skeleton.tsx
├── task/
│   ├── TaskCard.tsx          # Single task row with tick / skip gestures
│   ├── TaskList.tsx          # Virtualized list of TaskCards
│   ├── TaskHistoryRow.tsx    # 7-day history item
│   └── AIGenerateSheet.tsx   # Bottom sheet for AI task generation
├── space/
│   ├── SpaceHeader.tsx
│   ├── MemberAvatarRow.tsx
│   └── InviteQRCode.tsx
└── layout/
    ├── ScreenHeader.tsx
    └── EmptyState.tsx

hooks/
├── useSession.ts             # Auth session from Supabase
├── useSpace.ts               # Active space + members
├── useTasks.ts               # Tasks query + realtime subscription
├── useTaskActions.ts         # tick, skip, create, delete
└── useAIGenerate.ts          # Call Edge Function for AI task list

stores/
├── index.ts                  # Combines all slices
├── sessionSlice.ts           # Auth user, session token
├── spaceSlice.ts             # Active spaceId, space list
└── uiSlice.ts                # Loading states, active sheet

lib/
├── supabase.ts               # Supabase client singleton
├── api.ts                    # Typed wrappers for Supabase queries
└── constants.ts              # App-wide constants (task frequencies, etc.)

types/
└── index.ts                  # Shared TypeScript types (Space, Task, Member, etc.)
```

## Rules

- Route files in `app/` are thin — only compose components, call hooks, no business logic inline.
- Business logic lives in `hooks/` or `lib/api.ts`.
- Components in `components/ui/` must have zero Supabase/Zustand imports — pure presentational.
- `components/task/`, `components/space/` may import hooks.
- `stores/` slices never import from `hooks/` — no circular deps.

## `lib/supabase.ts` — Implementation Chuẩn

Supabase client singleton với đầy đủ React Native config. Copy chính xác pattern này:

```ts
import { AppState, Platform } from 'react-native'
import 'react-native-url-polyfill/auto'  // bắt buộc cho React Native
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, processLock } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,  // tránh race condition trên React Native
  },
})

// Quản lý token refresh theo app state
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
```

Dependencies cần install:
```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

**Lưu ý:** Dùng `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (không phải `SUPABASE_ANON_KEY` tên cũ) — Supabase đổi tên từ 2025.

## Naming Conventions

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts`, prefixed with `use`
- Stores: `camelCaseSlice.ts`
- Route files: `kebab-case.tsx` or `[param].tsx`
- Types: `PascalCase` interfaces in `types/index.ts`
