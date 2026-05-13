import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native'
import type { FC } from 'react'
import * as Haptics from 'expo-haptics'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'

export type NButtonVariant = 'accent' | 'ghost'
export type NButtonSize = 'lg' | 'md' | 'sm'

interface NButtonProps {
  label: string
  onPress: () => void
  variant?: NButtonVariant
  size?: NButtonSize
  isLoading?: boolean
  isDisabled?: boolean
  fullWidth?: boolean
}

const heights: Record<NButtonSize, number> = {
  lg: 60,
  md: 52,
  sm: 44,
}

const fontSizes: Record<NButtonSize, number> = {
  lg: 17,
  md: 15,
  sm: 14,
}

export const NButton: FC<NButtonProps> = ({
  label,
  onPress,
  variant = 'accent',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  fullWidth = false,
}) => {
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const handlePress = () => {
    if (isDisabled || isLoading) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const isAccent = variant === 'accent'

  const accentShadow = shadow('accent')
  const ghostShadow = shadow('raised', 'sm')

  const containerStyle = StyleSheet.flatten([
    styles.base,
    {
      height: heights[size],
      borderRadius: RADIUS.pill,
      alignSelf: fullWidth ? ('stretch' as const) : ('auto' as const),
      backgroundColor: isAccent ? c.accent : c.bg,
      opacity: isDisabled || isLoading ? 0.5 : 1,
    },
    isAccent ? accentShadow : ghostShadow,
    !isAccent && {
      borderWidth: 1,
      borderColor: isDark ? 'rgba(73,82,110,0.3)' : 'rgba(163,177,198,0.4)',
    },
  ])

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled || isLoading}
      style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
    >
      {isLoading ? (
        <ActivityIndicator color={isAccent ? '#fff' : c.accent} size="small" />
      ) : (
        <Text
          style={[
            styles.label,
            {
              fontSize: fontSizes[size],
              color: isAccent ? '#FFFFFF' : c.accent,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
})
