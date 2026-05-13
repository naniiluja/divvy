import { View } from 'react-native'
import type { FC, ReactNode } from 'react'
import type { ViewStyle } from 'react-native'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'

interface NCardProps {
  children: ReactNode
  variant?: 'raised' | 'inset'
  radius?: number
  padding?: number
  style?: ViewStyle
}

export const NCard: FC<NCardProps> = ({
  children,
  variant = 'raised',
  radius = RADIUS.card,
  padding = 20,
  style,
}) => {
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  return (
    <View
      style={[
        {
          backgroundColor: c.bg,
          borderRadius: radius,
          padding,
          ...shadow(variant),
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}
