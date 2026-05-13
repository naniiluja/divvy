# Component Guidelines

## Structure Convention

Every component file follows this order:

```tsx
// 1. Imports
import { View, Text, Pressable } from 'react-native'
import { type FC } from 'react'

// 2. Types
interface TaskCardProps {
  task: Task
  onTick: (taskId: string) => void
  onSkip: (taskId: string) => void
}

// 3. Component (named export, not default for shared components)
export const TaskCard: FC<TaskCardProps> = ({ task, onTick, onSkip }) => {
  // local state only
  return (
    <Pressable className="..." onPress={() => onTick(task.id)}>
      ...
    </Pressable>
  )
}

// 4. Default export only for route files (app/ directory)
```

## Props Rules

- All props typed with explicit interface, never inline `{ prop: type }`.
- Callbacks named `on<Event>` — `onTick`, `onSkip`, `onPress`.
- No optional props without a default value or documented reason.
- Avoid passing entire objects when only 1–2 fields are needed — destructure at call site.

## Styling with NativeWind v5

Use `className` exclusively. Never use `StyleSheet.create()` or inline `style={{}}`.

```tsx
// Correct
<View className="flex-1 bg-white dark:bg-gray-950 px-4 pt-6">

// Wrong
<View style={{ flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 }}>
```

Dark mode variants must always be specified in pairs:

```tsx
// Correct — both variants
<Text className="text-gray-900 dark:text-gray-100">

// Wrong — only one variant
<Text className="dark:text-gray-100">
```

## Touch Targets

- Use `Pressable` not `TouchableOpacity`.
- Minimum touch target: `min-h-[44px] min-w-[44px]` (Apple HIG).
- Task tick button: `w-12 h-12` with visual feedback via `active:opacity-70`.

## TaskCard Interaction

Long-press or swipe reveals skip option (MVP). Do not implement Request Cover in MVP.

```tsx
// Correct MVP skip pattern
<Pressable
  onLongPress={() => onSkip(task.id)}
  delayLongPress={400}
>
```

## Loading States

Every component that fetches data must show a `Skeleton` while loading:

```tsx
if (isLoading) return <TaskCardSkeleton />
if (error) return <ErrorState message={error.message} />
if (!task) return null
```

Never render a blank screen. Never throw during render for async failures.

## Forbidden Patterns

- No `useEffect` for data fetching — use custom hooks in `hooks/`.
- No Supabase client import inside `components/ui/`.
- No hardcoded colors — use Tailwind tokens only.
- No `React.memo` unless profiling proves it necessary.
- No `key={index}` — always use stable IDs.

---

## Neumorphic Components — Shared Primitives

Các component Neumorphic tái sử dụng trong `components/ui/`:

### `DivvyMark` — Logo Component

Logo "d" trong gradient circle, dùng ở nhiều nơi (Splash, Welcome header, v.v.).

```tsx
import { DivvyMark } from '@/components/ui/DivvyMark'

<DivvyMark size={42} />   // Welcome header
<DivvyMark size={132} />  // Splash screen
```

Tự động scale shadow theo size (`'sm'` khi size < 80, `'lg'` khi size >= 80).

### `NHeader` — Step Header

Header chuẩn cho auth flow — back button (round, raised) + step indicator (inset pill).

```tsx
import { NHeader } from '@/components/ui/NHeader'

<NHeader step={1} total={5} />                            // dùng router.back()
<NHeader step={1} total={5} onBack={() => router.replace('/(auth)/welcome')} />  // custom back
```

### `NButton` — Pill CTA Button

```tsx
<NButton label="Gửi mã →" onPress={fn} isLoading={false} isDisabled={false} fullWidth />
```

### `NInput` — Inset Input Field

Height 60, borderRadius 20, inset shadow simulate.

### `NDots` — Slide Progress Dots

Active dot: accent color, width 22. Inactive: textLight, width 8, opacity 0.4.

## Screen Layout Pattern (Auth)

Tất cả auth screens theo cấu trúc này:

```tsx
<View style={[styles.screen, { backgroundColor: c.bg }]}>
  <View style={styles.content}>  // paddingHorizontal: 28, paddingTop: 52, paddingBottom: 32
    <NHeader step={X} total={5} />
    {/* Heading block */}
    <View style={{ gap: 8 }}>
      <Text style={[styles.title, { color: c.textDark }]}>...</Text>
      <Text style={[styles.subtitle, { color: c.textMid }]}>...</Text>
    </View>
    {/* Content */}
    <View style={{ flex: 1 }} />  {/* spacer đẩy CTA xuống dưới */}
    <NButton label="..." onPress={fn} fullWidth />
  </View>
</View>
```
