# Frontend Spec — Divvy

Stack: React Native 0.78 + Expo SDK 54, Expo Router v4, NativeWind v4 (Tailwind v3), Zustand v5.

---

## Pre-Development Checklist

Before writing any frontend code:

- [ ] Does this screen exist in Expo Router file structure? Check `app/` directory.
- [ ] Is there an existing component in `components/` that does something similar?
- [ ] Does state belong in Zustand (shared) or `useState` (local to one component)?
- [ ] Does this screen need auth guard? If yes, place inside `app/(app)/` group.
- [ ] Are you using NativeWind `className` — NOT `StyleSheet.create()`? (Exception: Neumorphic shadow objects)
- [ ] **[Security]** Session storage dùng `LargeSecureStore` (không phải `AsyncStorage`)?
- [ ] **[Security]** Auth guard dùng `getUser()` (không phải `getSession()`)?
- [ ] **[Security]** Deep link params được validate trước khi gọi API?
- [ ] **[Security]** Zustand persist KHÔNG chứa `session` (Supabase tự handle)?
- [ ] Have you handled loading, error, and empty states?
- [ ] **[Neumorphic]** Does every surface use `backgroundColor: c.bg` (never white)?
- [ ] **[Neumorphic]** Does every shadow use `shadow('raised'/'inset'/'accent')` from `useNeumorphic()`?
- [ ] **[Neumorphic]** Are you passing colors via `ThemeColors` type (not `typeof LIGHT`)?
- [ ] **[Icons]** Are arrows/icons drawn with `View` (not Unicode chars like `→`)?
- [ ] **[Animation]** Are slide transitions using `Animated.parallel` (not `ScrollView` paging)?

---

## Quality Check

Before marking a task done:

- [ ] No inline `style={{}}` props — use `className` only (exception: Neumorphic shadow spread)
- [ ] No `any` type in component props or hook return values
- [ ] Loading skeleton shown while Supabase query is in-flight
- [ ] Error boundary or error state renders without crash
- [ ] Realtime subscription is unsubscribed on component unmount
- [ ] Haptic feedback on primary actions (tick, skip)
- [ ] Safe area insets applied on all root screens
- [ ] **[Neumorphic]** Raised elements: 2 shadows (dark bottom-right + light top-left)
- [ ] **[Neumorphic]** Inset elements: 2 inset shadows (dark top-left + light bottom-right)
- [ ] **[Neumorphic]** No single-shadow elements (= không phải Neumorphic)
- [ ] **[Package]** Dùng `npx expo install --fix` để align versions — không tự chỉnh package.json

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
