import type { ViewStyle } from 'react-native'
import { useTheme } from './useTheme'

export type ShadowKind = 'raised' | 'inset' | 'accent'
export type ShadowSize = 'sm' | 'md' | 'lg'

const SHADOW_DIMENSIONS: Record<ShadowKind, Record<ShadowSize, { off: number; blur: number; alpha?: number }>> = {
  raised: {
    sm: { off: 4, blur: 10 },
    md: { off: 8, blur: 18 },
    lg: { off: 14, blur: 30 },
  },
  inset: {
    sm: { off: 3, blur: 6 },
    md: { off: 5, blur: 10 },
    lg: { off: 7, blur: 14 },
  },
  accent: {
    sm: { off: 3, blur: 8, alpha: 0.35 },
    md: { off: 6, blur: 14, alpha: 0.45 },
    lg: { off: 10, blur: 22, alpha: 0.5 },
  },
}

// Hardcoded accent-shadow base — intentional: visual shadow does not follow the user-picked accent.
const ACCENT_SHADOW_RGB = '78, 93, 209'

export function useNeumorphic(): {
  shadow: (kind: ShadowKind, size?: ShadowSize) => ViewStyle
} {
  const { isDark } = useTheme()

  const lightShadow = isDark
    ? 'rgba(73, 82, 110, 0.5)'
    : 'rgba(255, 255, 255, 0.95)'
  const darkShadow = isDark
    ? 'rgba(8, 10, 18, 0.55)'
    : 'rgba(163, 177, 198, 0.55)'

  function shadow(kind: ShadowKind, size: ShadowSize = 'md'): ViewStyle {
    const { off, blur, alpha } = SHADOW_DIMENSIONS[kind][size]

    if (kind === 'inset') {
      return {
        boxShadow: [
          { offsetX: off, offsetY: off, blurRadius: blur, inset: true, color: darkShadow },
          { offsetX: -off, offsetY: -off, blurRadius: blur, inset: true, color: lightShadow },
        ],
      } as ViewStyle
    }

    if (kind === 'accent') {
      return {
        boxShadow: [
          { offsetX: off, offsetY: off, blurRadius: blur, color: `rgba(${ACCENT_SHADOW_RGB}, ${alpha ?? 0.45})` },
          { offsetX: -off, offsetY: -off, blurRadius: blur, color: lightShadow },
        ],
      } as ViewStyle
    }

    return {
      boxShadow: [
        { offsetX: off, offsetY: off, blurRadius: blur, color: darkShadow },
        { offsetX: -off, offsetY: -off, blurRadius: blur, color: lightShadow },
      ],
    } as ViewStyle
  }

  return { shadow }
}
