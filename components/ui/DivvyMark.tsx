import { View, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import type { FC } from 'react'

interface DivvyMarkProps {
  size?: number
}

export const DivvyMark: FC<DivvyMarkProps> = ({ size = 120 }) => {
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.32,
          backgroundColor: c.bg,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadow('raised', size >= 80 ? 'lg' : 'sm'),
        },
      ]}
    >
      <LinearGradient
        colors={[c.accent, c.accent2]}
        start={{ x: 0.15, y: 0.15 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size * 0.66,
          height: size * 0.66,
          borderRadius: RADIUS.avatar,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: size * 0.4,
            fontWeight: '700',
            letterSpacing: -0.04 * (size * 0.4),
          }}
        >
          d
        </Text>
      </LinearGradient>

      <View
        style={[
          {
            position: 'absolute',
            top: size * 0.18,
            right: size * 0.16,
            width: size >= 80 ? 10 : 6,
            height: size >= 80 ? 10 : 6,
            borderRadius: RADIUS.avatar,
            backgroundColor: c.bg,
            ...shadow('inset', 'sm'),
          },
        ]}
      />
    </View>
  )
}
