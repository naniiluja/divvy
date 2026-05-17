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

## Critical Gotchas — React Native + boxShadow (RN 0.81)

### Don't: boxShadow trong Pressable style function

> **Warning**: `boxShadow` object bị drop khi đặt trong `style={({ pressed }) => [...]}` của `Pressable`.

```tsx
// ❌ Sai — shadow bị mất hoàn toàn, chỉ còn màu nền
<Pressable
  style={({ pressed }) => [
    { backgroundColor: c.accent, opacity: pressed ? 0.8 : 1 },
    shadow('accent', 'md'),   // ← boxShadow bị drop ở đây
  ]}
>
```

```tsx
// ✅ Đúng — tách View chứa shadow, Pressable dùng absoluteFillObject
<View style={[shadowStyle, { height, borderRadius, backgroundColor }]}>
  <Pressable style={[StyleSheet.absoluteFillObject, styles.inner]}>
    {({ pressed }) => (
      <View style={[styles.inner, pressed && styles.pressed]}>
        <Text>{label}</Text>
      </View>
    )}
  </Pressable>
</View>
```

**Tại sao**: RN merge style arrays theo thứ tự, nhưng `boxShadow` là object phức tạp — khi kết hợp với function style của Pressable, RN flatten không đúng. Giải pháp: outer `View` chứa shadow + background, inner `Pressable` chứa opacity.

### Don't: opacity trên View chứa boxShadow

> **Warning**: Đặt `opacity` trên cùng View với `boxShadow` làm shadow bị ẩn theo opacity.

```tsx
// ❌ Sai — shadow biến mất khi opacity < 1
<View style={[shadow('accent'), { opacity: 0.5 }]} />

// ✅ Đúng — opacity trên inner element, không phải shadow wrapper
<View style={shadow('accent')}>
  <View style={{ opacity: isDisabled ? 0.5 : 1 }}>...</View>
</View>
```

### Don't: StyleSheet.flatten với boxShadow

> **Warning**: `StyleSheet.flatten([...])` loại bỏ `boxShadow` array — không dùng flatten khi style có shadow.

```tsx
// ❌ Sai
const merged = StyleSheet.flatten([styles.base, shadowStyle])

// ✅ Đúng — spread trực tiếp vào style array
<View style={[styles.base, shadowStyle]} />
```

### Text lệch trên Android — includeFontPadding

Android mặc định thêm padding trên/dưới text, làm chữ bị lệch khỏi center.

```tsx
// ✅ Luôn thêm vào Text trong button/tag
<Text style={{ includeFontPadding: false }}>Label</Text>
```

### Toggle Segmented — Width chính xác với onLayout

Không dùng `width: '47%'` hay hardcode pixel — sai trên mọi màn hình. Dùng `onLayout` để đo width thực:

```tsx
const [toggleWidth, setToggleWidth] = useState(0)
const PADDING = 5
const pillWidth = toggleWidth > 0 ? (toggleWidth - PADDING * 2) / 2 : 0

<View onLayout={e => setToggleWidth(e.nativeEvent.layout.width)}>
  {pillWidth > 0 && (
    <Animated.View style={{
      position: 'absolute',
      top: PADDING, bottom: PADDING,
      width: pillWidth,
      left: slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [PADDING, PADDING + pillWidth],
      }),
    }} />
  )}
</View>
```

**Tại sao**: `pillWidth = (totalWidth - 2*padding) / 2` đảm bảo pill khít đúng 50% bất kể screen size.

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

## Realtime Subscription Pattern

Tất cả screens dùng Supabase Realtime phải follow pattern này:

```tsx
const channelRef = useRef<RealtimeChannel | null>(null)

useEffect(() => {
  if (!spaceId) return

  // Unsubscribe existing trước khi tạo channel mới
  channelRef.current?.unsubscribe()
  channelRef.current = supabase
    .channel(`screen-${spaceId}-completions`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public',
      table: 'task_completions',
      filter: `space_id=eq.${spaceId}`,
    }, (payload) => {
      const incoming = payload.new as TaskCompletion
      // Replace completion cho cùng task_id (không append)
      setCompletions((prev) => {
        const without = prev.filter((c) => c.task_id !== incoming.task_id)
        return [incoming, ...without]
      })
    })
    .subscribe()

  return () => { channelRef.current?.unsubscribe() }
}, [spaceId])
```

**Gotcha**: Nếu không unsubscribe existing channel trước khi re-subscribe, sẽ có multiple listeners → duplicate completions.

## MemberWithProfile Pattern

`getSpaceMembers()` trả về `SpaceMember[]` với nested `profiles` join. Phải type-cast để access:

```ts
type MemberWithProfile = SpaceMember & {
  profiles?: { display_name?: string; avatar_emoji?: string }
}

// Usage
const displayName = (m as MemberWithProfile).profiles?.display_name ?? m.user_id.slice(0, 6)
const emoji = (m as MemberWithProfile).profiles?.avatar_emoji ?? '👤'
```

## Tab Icon Pattern (SVG)

Tab icons dùng `react-native-svg`, không phải emoji hay text:

```tsx
import Svg, { Circle, Path, Rect } from 'react-native-svg'

function IconToday({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Rect fill="none" stroke={color} strokeWidth={1.8} x={3.5} y={5} width={17} height={15} rx={3} />
      <Path stroke={color} strokeWidth={1.8} strokeLinecap="round" d="M8 3v4M16 3v4M3.5 10h17" />
    </Svg>
  )
}
```

Tham khảo exact SVG paths trong `screens-app.jsx` của design source (TabBar component).

## Conditional Render Trap — Action Hidden in Sub-State

### Common Mistake: Action button nested in a sub-state's condition

**Symptom**: User reports "I can't find the + button anymore" after completing all tasks in a list.

**Cause**: The "+ Task" header sits inside `{todoTasks.length > 0 && (...)}`. When all tasks become done, the entire header (including the button) disappears even though the user is still on a screen where adding tasks makes sense.

```tsx
// ❌ Wrong — button hidden when sub-state is empty
{todoTasks.length > 0 && (
  <>
    <View style={styles.sectionRow}>
      <Text>CẦN LÀM · {todoTasks.length}</Text>
      <Pressable onPress={() => router.push('/(app)/task/new')}>
        <Text>+ Task</Text>
      </Pressable>
    </View>
    <View>{todoTasks.map(...)}</View>
  </>
)}

{doneTasks.length > 0 && <View>{doneTasks.map(...)}</View>}
// → If todoTasks.length === 0 but doneTasks.length > 0,
//   user sees ONLY "ĐÃ XONG" with no way to add a new task.
```

**Fix**: Render the action at the parent-state level (whole-list scope), not nested under a sub-state condition.

```tsx
// ✅ Correct — button visible whenever any task exists
{tasks.length > 0 && (
  <View style={styles.sectionRow}>
    <Text>{todoTasks.length > 0 ? `CẦN LÀM · ${todoTasks.length}` : `HÔM NAY · ${tasks.length}`}</Text>
    <Pressable onPress={() => router.push('/(app)/task/new')}>
      <Text>+ Task</Text>
    </Pressable>
  </View>
)}

{todoTasks.length > 0 && <View>{todoTasks.map(...)}</View>}
{doneTasks.length > 0 && <View>{doneTasks.map(...)}</View>}
{tasks.length === 0 && <EmptyState ... />}
```

**Prevention**: When deriving sub-arrays (`todoTasks`, `doneTasks`) from a parent (`tasks`), ask: "Does this action belong to the sub-state or the parent state?" Actions belong to the **largest scope** in which they remain meaningful.

---

---

## ShinyText — Animated Shimmer Text

`components/ui/ShinyText` — text pulse animation dùng cho AI-related text (loading states, badges).

```tsx
import { ShinyText } from '@/components/ui/ShinyText'

<ShinyText
  text="Claude đang chia việc…"
  color={c.textDark}
  shineColor="#ffffff"
  speed={2}
  textStyle={styles.loadTitle}
/>
```

**Props**:
- `color` — màu chữ nền (dùng theme token, ví dụ `c.textDark`, `c.accent`)
- `shineColor` — màu sáng lên (thường `"#ffffff"`)
- `speed` — chu kỳ animation tính bằng giây (2 = nhanh, 3 = chậm)
- `textStyle` — forward style vào `Animated.Text` (font, size, weight)

**Dùng ở đâu**: Chỉ dùng cho AI-generated loading states và AI badge. Không dùng cho text thường.

### Reanimated v4 — Gotchas Animation API

> **Warning**: Reanimated v4 đổi nhiều API so với v3. Các lỗi phổ biến:

#### Easing API

```ts
// ❌ Sai — không tồn tại trong v4
Easing.inOutSine
Easing.inOut(Easing.sine)  // "sine" không có, phải là "sin"

// ✅ Đúng
Easing.inOut(Easing.sin)
Easing.inOut(Easing.quad)
Easing.linear
```

#### Animation phải chạy trong useEffect, không phải render

```ts
// ❌ Sai — gọi trực tiếp trong render body
const progress = useSharedValue(0)
progress.value = withRepeat(withTiming(1, ...), -1)  // ← lỗi runtime

// ✅ Đúng — wrap trong useEffect
useEffect(() => {
  progress.value = withRepeat(withTiming(1, ...), -1)
}, [progress])
```

#### Props động trong useAnimatedStyle — dùng useSharedValue

```ts
// ❌ Sai — stale closure, props đổi nhưng animation không update
const animatedStyle = useAnimatedStyle(() => ({
  color: interpolateColor(progress.value, [0, 1], [color, shineColor]),  // color từ props
}))

// ✅ Đúng — bridge props qua shared value
const colorFrom = useSharedValue(color)
useEffect(() => { colorFrom.value = color }, [color])

const animatedStyle = useAnimatedStyle(() => ({
  color: interpolateColor(progress.value, [0, 1], [colorFrom.value, colorTo.value]),
}))
```

### Native Modules cần Rebuild

> **Warning**: Một số thư viện animation yêu cầu native module — chỉ hot-reload JS là không đủ.

| Package | Cần rebuild? |
|---|---|
| `@react-native-masked-view/masked-view` | ✅ Cần `npx expo run:android` |
| `react-native-reanimated` | ❌ Hot-reload được |
| `expo-linear-gradient` | ❌ Hot-reload được |

`@react-native-masked-view` cho phép gradient clip theo hình chữ (đúng như web `backgroundClip: text`), nhưng phải rebuild app sau khi install. Nếu không thể rebuild, dùng `interpolateColor` để tạo pulse effect thay thế.

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
