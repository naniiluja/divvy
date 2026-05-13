# Divvy Foundation — Giai Đoạn 1

## Goal

Khởi tạo Expo project với Expo Router, cài đặt toàn bộ dependencies, implement Neumorphic design system primitives, và hoàn chỉnh Auth flow (Splash → Welcome → Phone/OTP → Profile → Home skeleton).

Deliverable: App chạy được trên Android Emulator + Expo Go với Auth flow hoàn chỉnh.

---

## Checklist

### Setup
- [ ] `npx create-expo-app@latest divvy --template tabs` (TypeScript)
- [ ] Cài dependencies: `nativewind`, `zustand`, `@supabase/supabase-js`, `expo-linear-gradient`, `expo-haptics`, `expo-secure-store`
- [ ] Setup `tailwind.config.js` với custom colors từ design system
- [ ] Tạo `.env` với `EXPO_PUBLIC_SUPABASE_URL` và `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Supabase client singleton (`lib/supabase.ts`)

### Neumorphic Design System
- [ ] `hooks/useTheme.ts` — light/dark theme state (Zustand)
- [ ] `hooks/useNeumorphic.ts` — shadow style generator (raised/inset/accent × sm/md/lg)
- [ ] `constants/theme.ts` — colors, typography, spacing tokens
- [ ] Components:
  - [ ] `NCard` — raised/inset card surface
  - [ ] `NButton` — pill CTA (accent/ghost, lg/md/sm)
  - [ ] `NIconBtn` — round icon button
  - [ ] `NInput` — inset input field (h=60, radius=20)
  - [ ] `NDots` — inset dot progress indicator

### Screens (Onboarding)
- [ ] `app/(auth)/splash.tsx` — logo + spinner, auto-advance 2.2s
- [ ] `app/(auth)/welcome.tsx` — 3-slide carousel (Tasks / Realtime / AI)
- [ ] `app/(auth)/phone.tsx` — Phone OTP hoặc Email (segmented toggle)
- [ ] `app/(auth)/otp.tsx` — 6-ô OTP input (inset → raised khi điền)
- [ ] `app/(auth)/profile.tsx` — tên + emoji avatar picker

### Auth Logic
- [ ] Supabase Phone OTP: `signInWithOtp({ phone })` → `verifyOtp`
- [ ] Email fallback: `signInWithOtp({ email })`
- [ ] Session persistence với `expo-secure-store`
- [ ] INSERT vào `profiles` table sau khi verify xong
- [ ] Navigation guard: redirect về `(auth)` nếu chưa login

### Navigation Skeleton
- [ ] `app/(app)/_layout.tsx` — tab layout (Today / History / Members / Profile)
- [ ] `app/(app)/index.tsx` — Home placeholder (chờ Phase 3)
- [ ] Redirect logic: nếu user chưa có Space → show Space setup flow

---

## Design Tokens (từ prototype)

```ts
export const colors = {
  light: {
    bg: '#E4E9F2',
    bg2: '#D9DFEC',
    neuLight: 'rgba(255,255,255,0.95)',
    neuDark: 'rgba(163,177,198,0.55)',
    textDark: '#2D3454',
    textMid: '#737CA0',
    textLight: '#A6AEC8',
    accent: '#6C7CFF',
    accent2: '#A78BFA',
  },
  dark: {
    bg: '#262B3D',
    bg2: '#1E2231',
    neuLight: 'rgba(73,82,110,0.5)',
    neuDark: 'rgba(8,10,18,0.55)',
    textDark: '#E8ECF8',
    textMid: '#9DA5C2',
    textLight: '#5C6584',
    accent: '#6C7CFF',
    accent2: '#A78BFA',
  },
}

export const radius = {
  card: 28,
  input: 20,
  pill: 999,
  smallCard: 14,
  tab: 22,
}

export const font = {
  display: 'PlusJakartaSans_700Bold',
  body: 'PlusJakartaSans_500Medium',
}
```

---

## Acceptance Criteria

- [ ] App khởi động, Splash hiện 2.2s rồi tự chuyển sang Welcome
- [ ] Welcome carousel swipe được qua 3 slides
- [ ] Nhập SĐT → nhận OTP → verify → vào màn hình Profile
- [ ] Điền tên + chọn emoji → lưu vào Supabase profiles table
- [ ] Restart app → vẫn còn login (session persist)
- [ ] Neumorphic shadows hiển thị đúng trên cả Android + iOS
- [ ] Dark mode toggle hoạt động (preview, sẽ wire vào Settings ở Phase 6)

---

## Technical Notes

- React Native shadows: iOS dùng `shadowColor/shadowOffset/shadowOpacity/shadowRadius`, Android dùng `elevation` — `useNeumorphic()` hook trả về cả hai
- NativeWind v4 dùng `cssInterop` — cần config đúng cho custom shadows
- Supabase Phone OTP cần Twilio — nếu chưa setup thì dùng Email OTP trước
- `expo-secure-store` cho session storage (không dùng AsyncStorage cho sensitive data)
- Font: cài `@expo-google-fonts/plus-jakarta-sans`
