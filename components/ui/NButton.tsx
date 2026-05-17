import { Pressable, Text, ActivityIndicator, View, StyleSheet } from 'react-native'
import type { FC } from 'react'
import * as Haptics from 'expo-haptics'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { RADIUS } from '@/constants/theme'

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

const HEIGHT: Record<NButtonSize, number> = { lg: 60, md: 60, sm: 44 }
const FONTSIZE: Record<NButtonSize, number> = { lg: 17, md: 17, sm: 14 }

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
  const { c } = useTheme()

  const handlePress = () => {
    if (isDisabled || isLoading) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const isAccent = variant === 'accent'
  const shadowStyle = isAccent ? shadow('accent', 'md') : shadow('raised', 'sm')

  return (
    <View
      style={[
        shadowStyle,
        {
          height: HEIGHT[size],
          borderRadius: RADIUS.pill,
          backgroundColor: isAccent ? c.accent : c.bg,
          alignSelf: fullWidth ? 'stretch' : 'auto',
          opacity: isDisabled ? 0.5 : 1,
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        disabled={isDisabled || isLoading}
        style={[
          StyleSheet.absoluteFillObject,
          styles.inner,
        ]}
      >
        {({ pressed }) => (
          <View style={[styles.inner, pressed && styles.pressed]}>
            {isLoading ? (
              <ActivityIndicator color={isAccent ? '#fff' : c.accent} size="small" />
            ) : (
              <Text style={[
                styles.label,
                { fontSize: FONTSIZE[size], color: isAccent ? '#fff' : c.accent },
              ]}>
                {label}
              </Text>
            )}
          </View>
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.82,
  },
  label: {
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'center',
    includeFontPadding: false,
  },
})
