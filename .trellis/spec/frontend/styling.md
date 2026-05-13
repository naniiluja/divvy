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

- Không dùng `StyleSheet.create()` hay `style={{}}`.
- Không dùng hex color hardcode trong className.
- Không upgrade NativeWind lên v5/v6 mà không kiểm tra RN version compatibility.
