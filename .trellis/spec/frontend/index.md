# Frontend Spec — Divvy

Stack: React Native 0.78 + Expo SDK 54, Expo Router v4, NativeWind v4 (Tailwind v3), Zustand v5.

---

## Design Source of Truth

**Claude Design export** là nguồn thiết kế chính thức duy nhất cho Divvy frontend:
- URL: `https://api.anthropic.com/v1/design/h/3UeRaLFxp3qWa_RpUKdcNw?open_file=Divvy+Onboarding.html`
- Bundle files: `neuro.jsx` (primitives), `screens-a.jsx` (onboarding), `screens-b.jsx` (space/AI), `screens-app.jsx` (home/task/history), `screens-app2.jsx` (members/profile)
- Khi có xung đột giữa code hiện tại và design → **design thắng**
- Bundle là gzip tar — giải nén bằng PowerShell GzipStream rồi `tar -xf`

## Pre-Development Checklist

Before writing any frontend code:

- [ ] Does this screen exist in Expo Router file structure? Check `app/` directory.
- [ ] Is there an existing component in `components/` that does something similar?
- [ ] Does state belong in Zustand (shared) or `useState` (local to one component)?
- [ ] Does this screen need auth guard? If yes, place inside `app/(app)/` group.
- [ ] Are you using NativeWind `className` — NOT `StyleSheet.create()`? (Exception: Neumorphic shadow objects)
- [ ] **[Design]** Đã đọc screen tương ứng trong design source of truth (`screens-a/b/app.jsx`)?
- [ ] **[Security]** Session storage dùng `LargeSecureStore` (không phải `AsyncStorage`)?
- [ ] **[Security]** Auth guard dùng `getUser()` (không phải `getSession()`)?
- [ ] **[Security]** Deep link params được validate trước khi gọi API?
- [ ] **[Security]** Zustand persist KHÔNG chứa `session` (Supabase tự handle)?
- [ ] Have you handled loading, error, and empty states?
- [ ] **[Neumorphic]** Does every surface use `backgroundColor: c.bg` (never white)?
- [ ] **[Neumorphic]** Does every shadow use `shadow('raised'/'inset'/'accent')` from `useNeumorphic()`?
- [ ] **[Neumorphic]** Are you passing colors via `ThemeColors` type (not `typeof LIGHT`)?
- [ ] **[Icons]** Tab icons dùng SVG từ `react-native-svg` (không phải emoji hay Unicode)?
- [ ] **[Icons]** Arrows/icons drawn with `View` (not Unicode chars like `→`)?
- [ ] **[Animation]** Are slide transitions using `Animated.parallel` (not `ScrollView` paging)?

---

## Quality Check

Before marking a task done:

- [ ] No inline `style={{}}` props — use `className` only (exception: Neumorphic shadow spread)
- [ ] No `any` type in component props or hook return values
- [ ] Loading skeleton shown while Supabase query is in-flight
- [ ] Error boundary or error state renders without crash
- [ ] Realtime subscription unsubscribed on component unmount (`return () => { channelRef.current?.unsubscribe() }`)
- [ ] Haptic feedback on primary actions (tick, skip)
- [ ] Safe area insets applied on all root screens
- [ ] **[Neumorphic]** Raised elements: 2 shadows (dark bottom-right + light top-left)
- [ ] **[Neumorphic]** Inset elements: 2 inset shadows (dark top-left + light bottom-right)
- [ ] **[Neumorphic]** No single-shadow elements (= không phải Neumorphic)
- [ ] **[Neumorphic]** `opacity` KHÔNG đặt trên View chứa `boxShadow` — wrap inner View riêng
- [ ] **[Package]** Dùng `npm install --legacy-peer-deps` cho packages có peer dep conflict (Windows npm 11)

---

## Guidelines Index

| Guide | File |
|-------|------|
| Directory Structure | [directory-structure.md](./directory-structure.md) |
| Component Patterns | [component-guidelines.md](./component-guidelines.md) |
| Custom Hooks | [hook-guidelines.md](./hook-guidelines.md) |
| State Management | [state-management.md](./state-management.md) |
| Type Safety | [type-safety.md](./type-safety.md) |
| Quality & Forbidden Patterns | [quality-guidelines.md](./quality-guidelines.md) |
| Navigation (Expo Router) | [navigation.md](./navigation.md) |
| Styling & Design Tokens | [styling.md](./styling.md) |
