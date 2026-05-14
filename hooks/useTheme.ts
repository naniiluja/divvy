import { useColorScheme } from 'react-native'
import { colors } from '@/constants/theme'
import { useStore } from '@/stores'

export type ThemeMode = 'light' | 'dark'
export type ThemeColors = typeof colors.light | typeof colors.dark

export function useTheme(): {
  mode: ThemeMode
  colors: ThemeColors
  isDark: boolean
} {
  const systemScheme = useColorScheme()
  const themeOverride = useStore((s) => s.themeOverride)

  const isDark = themeOverride === 'system'
    ? systemScheme === 'dark'
    : themeOverride === 'dark'

  const mode: ThemeMode = isDark ? 'dark' : 'light'

  return {
    mode,
    colors: isDark ? colors.dark : colors.light,
    isDark,
  }
}
