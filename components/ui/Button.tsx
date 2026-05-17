import { Pressable, Text, ActivityIndicator } from 'react-native'
import type { FC } from 'react'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/hooks/useTheme'

export type ButtonVariant = 'accent' | 'ghost'
export type ButtonSize = 'lg' | 'md' | 'sm'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  isDisabled?: boolean
}

const sizeClasses: Record<ButtonSize, string> = {
  lg: 'py-4 px-8 min-h-[56px]',
  md: 'py-3 px-6 min-h-[48px]',
  sm: 'py-2 px-4 min-h-[44px]',
}

const labelSizeClasses: Record<ButtonSize, string> = {
  lg: 'text-base',
  md: 'text-sm',
  sm: 'text-xs',
}

export const Button: FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'accent',
  size = 'md',
  isLoading = false,
  isDisabled = false,
}) => {
  const { c } = useTheme()

  const handlePress = () => {
    if (isDisabled || isLoading) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const isAccent = variant === 'accent'

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled || isLoading}
      className={[
        'rounded-pill items-center justify-center flex-row',
        sizeClasses[size],
        isAccent
          ? 'bg-accent dark:bg-accent'
          : 'bg-transparent border border-accent dark:border-accent',
        (isDisabled || isLoading) ? 'opacity-50' : 'active:opacity-80',
      ].join(' ')}
    >
      {isLoading ? (
        <ActivityIndicator color={isAccent ? c.bg : c.accent} size="small" />
      ) : (
        <Text
          className={[
            'font-body text-center font-semibold',
            labelSizeClasses[size],
            isAccent ? 'text-white' : 'text-accent dark:text-accent',
          ].join(' ')}
        >
          {label}
        </Text>
      )}
    </Pressable>
  )
}
