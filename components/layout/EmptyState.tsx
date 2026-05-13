import { View, Text } from 'react-native'
import type { FC } from 'react'
import { Button } from '@/components/ui/Button'

interface EmptyStateProps {
  emoji?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export const EmptyState: FC<EmptyStateProps> = ({
  emoji = '📭',
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <View className="flex-1 items-center justify-center px-8 gap-4">
      <Text className="text-5xl">{emoji}</Text>
      <Text className="text-text-dark dark:text-text-dark-d text-xl font-display text-center">
        {title}
      </Text>
      {description ? (
        <Text className="text-text-mid dark:text-text-mid-d text-base font-body text-center">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} size="md" />
      ) : null}
    </View>
  )
}
