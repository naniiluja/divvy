import { View, Text } from 'react-native'
import type { FC } from 'react'

interface AvatarProps {
  emoji: string
  size?: 'sm' | 'md' | 'lg'
  isSelected?: boolean
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
}

const textSizeClasses = {
  sm: 'text-base',
  md: 'text-2xl',
  lg: 'text-3xl',
}

export const Avatar: FC<AvatarProps> = ({
  emoji,
  size = 'md',
  isSelected = false,
}) => {
  return (
    <View
      className={[
        sizeClasses[size],
        'rounded-card items-center justify-center',
        isSelected
          ? 'bg-accent/20 dark:bg-accent/30 border-2 border-accent'
          : 'bg-neu-bg dark:bg-neu-d-bg border border-neu-dark/20 dark:border-neu-d-dark/20',
      ].join(' ')}
    >
      <Text className={textSizeClasses[size]}>{emoji}</Text>
    </View>
  )
}
