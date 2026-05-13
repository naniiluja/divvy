# Styling & Design Tokens (NativeWind v4 / Tailwind v3)

## Version Constraint

- **NativeWind: `^4.1`** — stable, compatible với Expo SDK 54 (RN 0.78)
- **Tailwind CSS: `^3.4`** — config qua `tailwind.config.js`
- NativeWind v5 + Tailwind v4 yêu cầu RN 0.81+ (Expo SDK 55+) — **không dùng** cho project này

## Setup Files

### `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#6366F1',    // indigo-500
          secondary: '#8B5CF6',  // violet-500
          accent: '#EC4899',     // pink-500
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#0F0F0F',
        },
        card: {
          DEFAULT: '#F9FAFB',
          dark: '#1A1A1A',
        },
        text: {
          primary: '#111827',
          secondary: '#6B7280',
          'primary-dark': '#F9FAFB',
          'secondary-dark': '#9CA3AF',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      borderRadius: {
        card: '16px',
        button: '12px',
      },
    },
  },
  plugins: [],
}
```

### `babel.config.js`

```js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  }
}
```

### `metro.config.js`

```js
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

module.exports = withNativeWind(config, { input: './global.css' })
```

### `global.css` (minimal — chỉ cần import Tailwind)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### `app/_layout.tsx` (import global.css)

```tsx
import '../global.css'
// rest of layout
```

## Design Tokens trong Code

```tsx
// Task card
<View className="bg-card dark:bg-card-dark rounded-card p-4 border border-gray-100 dark:border-gray-800">
  <Text className="text-text-primary dark:text-text-primary-dark text-base font-medium">
    {task.name}
  </Text>
  <Text className="text-text-secondary dark:text-text-secondary-dark text-sm mt-1">
    {completedBy} · {completedAt}
  </Text>
</View>

// Primary button
<Pressable className="bg-brand-primary rounded-button py-3 px-6 active:opacity-80">
  <Text className="text-white text-base font-semibold text-center">Confirm</Text>
</Pressable>

// Task tick — done
<View className="w-10 h-10 rounded-full bg-success items-center justify-center">
  <Ionicons name="checkmark" size={20} color="white" />
</View>

// Task tick — pending
<View className="w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600" />
```

## Dark Mode

NativeWind v4 dark mode theo system preference tự động. Luôn khai báo cả 2 variant:

```tsx
// Correct
<Text className="text-text-primary dark:text-text-primary-dark">

// Wrong — thiếu light mode
<Text className="dark:text-text-primary-dark">
```

## Typography

- Headings: `font-bold` hoặc `font-semibold`
- Body: `font-normal`, `text-base` (16px)
- Task name: `text-base font-medium`
- Captions: `text-sm text-text-secondary dark:text-text-secondary-dark`
- Minimum size: `text-xs` (12px) — không dùng nhỏ hơn

## Spacing System

Tailwind 4px base scale — chỉ dùng bội số 4:

```
p-1 = 4px  |  p-2 = 8px  |  p-3 = 12px
p-4 = 16px |  p-6 = 24px |  p-8 = 32px
```

Không dùng arbitrary values `p-[14px]` trừ khi khớp chính xác design spec.

## Screen Layout Chuẩn

```tsx
import { SafeAreaView } from 'react-native-safe-area-context'

<SafeAreaView className="flex-1 bg-surface dark:bg-surface-dark">
  <ScreenHeader title="Home" />
  <ScrollView
    className="flex-1"
    contentContainerClassName="px-4 pb-8"
  >
    {/* content */}
  </ScrollView>
</SafeAreaView>
```

## Forbidden

- Không dùng `StyleSheet.create()` hay `style={{}}` — ngoại trừ Neumorphic shadows (xem bên dưới).
- Không dùng hex color hardcode trong className.
- Không upgrade NativeWind lên v5/v6 mà không kiểm tra RN version compatibility.

---

## Neumorphic Design System (Quan Trọng)

Divvy dùng phong cách **Neumorphism** — dual shadow (tối + sáng) tạo cảm giác element "trồi lên" hoặc "lõm xuống" khỏi nền đơn sắc.

### Dual Shadow — Rule Cốt Lõi

Neumorphic PHẢI có 2 shadow:
- **Shadow tối**: bottom-right (raised) hoặc top-left (inset)
- **Shadow sáng**: top-left (raised) hoặc bottom-right (inset)

**Không bao giờ dùng 1 shadow đơn** — đó là flat design thông thường, không phải Neumorphic.

### `useNeumorphic()` Hook — Cách Dùng Đúng

```ts
import { useNeumorphic } from '@/hooks/useNeumorphic'

const { shadow } = useNeumorphic()

// raised — element trồi lên khỏi nền
<View style={{ backgroundColor: c.bg, ...shadow('raised', 'md') }} />

// inset — element lõm vào nền (input, pressed state)
<View style={{ backgroundColor: c.bg, ...shadow('inset', 'sm') }} />

// accent — nút CTA nổi bật với accent color shadow
<View style={{ backgroundColor: c.accent, ...shadow('accent') }} />
```

Shadow sizes: `'sm'` | `'md'` | `'lg'`

### RN 0.81 `boxShadow` Array — Tại Sao Dùng

React Native 0.81+ hỗ trợ `boxShadow` array (giống CSS), bao gồm `inset: true`. **Đây là cách duy nhất** để implement đúng Neumorphic dual shadow trên cả iOS và Android.

```ts
// Đúng — dual shadow với boxShadow array (RN 0.81+)
{
  boxShadow: [
    { offsetX: 8, offsetY: 8, blurRadius: 18, color: darkShadow },
    { offsetX: -8, offsetY: -8, blurRadius: 18, color: lightShadow },
  ]
}

// Sai — single shadow, không phải Neumorphic
{
  shadowColor: '...', shadowOffset: { width: 8, height: 8 }, ...
}
```

**Exception hợp lệ**: `StyleSheet.create()` được phép CHỈ khi chứa shadow values từ `useNeumorphic()`. Layout, colors, spacing vẫn dùng `className`.

### ThemeColors Type

Dùng `ThemeColors` interface (không phải `typeof LIGHT`) khi pass theme qua props:

```ts
// Đúng
import { ThemeColors } from '@/constants/theme'
function MyComponent({ c }: { c: ThemeColors }) { ... }

// Sai — literal type conflict giữa LIGHT và DARK
function MyComponent({ c }: { c: typeof LIGHT }) { ... }
```

### Color Tokens

```ts
// Light mode
bg: '#E4E9F2'       // Nền chính — tất cả surfaces dùng màu này
bg2: '#D9DFEC'      // Nền phụ
textDark: '#2D3454' // Heading, label chính
textMid: '#737CA0'  // Subtitle, label phụ
textLight: '#A6AEC8'// Placeholder, disabled
accent: '#6C7CFF'   // Periwinkle — primary action
accent2: '#A78BFA'  // Gradient pair

// Dark mode
bg: '#262B3D'
bg2: '#1E2231'
// ... (xem constants/theme.ts)
```

**Screen background luôn = `backgroundColor: c.bg`** — không dùng `white` hay `#fff`.

### Typography Spec (đúng theo design)

```
Logo "divvy":     fontSize: 44, fontWeight: '700', letterSpacing: -1.76
Title screens:    fontSize: 30, fontWeight: '700', letterSpacing: -1.05, lineHeight: 33
Welcome title:    fontSize: 34, fontWeight: '700', letterSpacing: -1.19, lineHeight: 38
Badge text:       fontSize: 11, fontWeight: '600', letterSpacing: 0.88, textTransform: 'uppercase'
Body text:        fontSize: 15, lineHeight: 23
Section label:    fontSize: 11-12, fontWeight: '600-700', letterSpacing: 0.88-1.1, textTransform: 'uppercase'
```

### Icons / Arrows — Không Dùng Ký Tự Unicode

Unicode arrows (`→`, `‹`, `›`) có **baseline lệch** — không căn giữa đúng trong View.

```tsx
// Sai — baseline lệch
<Text style={styles.nextBtnText}>→</Text>

// Đúng — vẽ bằng View thuần
function ArrowRight({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 14, height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{
        position: 'absolute', right: 0,
        width: 8, height: 8,
        borderTopWidth: 2, borderRightWidth: 2,
        borderColor: color, borderRadius: 1,
        transform: [{ rotate: '45deg' }],
      }} />
    </View>
  )
}
```

### Slide Transition — Không Dùng ScrollView Paging

`ScrollView` với `pagingEnabled` tạo cảm giác "vuốt trang" — không phải transition mượt.
Dùng `Animated.parallel` fade + slide thay thế:

```tsx
// Đúng — crossfade + slide
const fadeAnim = useRef(new Animated.Value(1)).current
const slideAnim = useRef(new Animated.Value(0)).current

const goTo = (next: number) => {
  Animated.parallel([
    Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
    Animated.timing(slideAnim, { toValue: -20, duration: 160, useNativeDriver: true }),
  ]).start(() => {
    setActiveIndex(next)
    slideAnim.setValue(20)
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start()
  })
}
```
