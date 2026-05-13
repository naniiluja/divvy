import { useColorScheme } from 'react-native'
import { colors } from '@/constants/theme'

export type ThemeMode = 'light' | 'dark'
export type ThemeColors = typeof colors.light | typeof colors.dark

export function useTheme(): {
  mode: ThemeMode
  colors: ThemeColors
  isDark: boolean
} {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const mode: ThemeMode = isDark ? 'dark' : 'light'

  return {
    mode,
    colors: isDark ? colors.dark : colors.light,
    isDark,
  }
}
