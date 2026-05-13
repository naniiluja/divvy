import { View, Text } from 'react-native'
import type { FC } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-neu-dark/20 dark:bg-neu-d-dark/20',
  success: 'bg-success/20',
  warning: 'bg-warning/20',
  danger: 'bg-danger/20',
}

const labelVariantClasses: Record<BadgeVariant, string> = {
  default: 'text-text-mid dark:text-text-mid-d',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
}

export const Badge: FC<BadgeProps> = ({ label, variant = 'default' }) => {
  return (
    <View className={['px-2 py-1 rounded-full', variantClasses[variant]].join(' ')}>
      <Text className={['text-xs font-body', labelVariantClasses[variant]].join(' ')}>
        {label}
      </Text>
    </View>
  )
}
