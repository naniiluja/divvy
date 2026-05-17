import { useColorScheme } from 'react-native'
import { colors, type ThemeColors } from '@/constants/theme'
import { useStore } from '@/stores'
import { ACCENT_COLORS } from '@/stores/uiSlice'

export type ThemeMode = 'light' | 'dark'
export { ThemeColors }

function resolveIsDark(override: 'system' | 'light' | 'dark', systemScheme: 'light' | 'dark' | null | undefined): boolean {
  if (override === 'system') return systemScheme === 'dark'
  return override === 'dark'
}

export function useTheme(): {
  mode: ThemeMode
  colors: ThemeColors
  isDark: boolean
  accentColor: string
  c: ThemeColors
} {
  const systemScheme = useColorScheme()
  const themeOverride = useStore((s) => s.themeOverride)
  const accentKey = useStore((s) => s.accentKey)

  const isDark = resolveIsDark(themeOverride, systemScheme)
  const accentColor = ACCENT_COLORS[accentKey]
  const base = isDark ? colors.dark : colors.light
  const c: ThemeColors = { ...base, accent: accentColor }

  return {
    mode: isDark ? 'dark' : 'light',
    colors: c,
    isDark,
    accentColor,
    c,
  }
}
