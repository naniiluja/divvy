import type { ViewStyle } from 'react-native'
import { useTheme } from './useTheme'

export type ShadowKind = 'raised' | 'inset' | 'accent'
export type ShadowSize = 'sm' | 'md' | 'lg'

export function useNeumorphic() {
  const { isDark } = useTheme()

  const lightShadow = isDark
    ? 'rgba(73, 82, 110, 0.5)'
    : 'rgba(255, 255, 255, 0.95)'
  const darkShadow = isDark
    ? 'rgba(8, 10, 18, 0.55)'
    : 'rgba(163, 177, 198, 0.55)'

  const shadow = (kind: ShadowKind, size: ShadowSize = 'md'): ViewStyle => {
    if (kind === 'raised') {
      const off = size === 'sm' ? 4 : size === 'md' ? 8 : 14
      const blur = size === 'sm' ? 10 : size === 'md' ? 18 : 30
      return {
        boxShadow: [
          { offsetX: off, offsetY: off, blurRadius: blur, color: darkShadow },
          { offsetX: -off, offsetY: -off, blurRadius: blur, color: lightShadow },
        ],
      } as ViewStyle
    }

    if (kind === 'inset') {
      const off = size === 'sm' ? 3 : size === 'md' ? 5 : 7
      const blur = size === 'sm' ? 6 : size === 'md' ? 10 : 14
      return {
        boxShadow: [
          { offsetX: off, offsetY: off, blurRadius: blur, inset: true, color: darkShadow },
          { offsetX: -off, offsetY: -off, blurRadius: blur, inset: true, color: lightShadow },
        ],
      } as ViewStyle
    }

    // accent
    const off = size === 'sm' ? 3 : size === 'md' ? 6 : 10
    const blur = size === 'sm' ? 8 : size === 'md' ? 14 : 22
    return {
      boxShadow: [
        { offsetX: off, offsetY: off, blurRadius: blur, color: `rgba(78, 93, 209, ${size === 'sm' ? 0.35 : size === 'md' ? 0.45 : 0.5})` },
        { offsetX: -off, offsetY: -off, blurRadius: blur, color: lightShadow },
      ],
    } as ViewStyle
  }

  return { shadow }
}
