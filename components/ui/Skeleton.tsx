import { View } from 'react-native'
import type { FC } from 'react'

interface SkeletonProps {
  width?: string
  height?: string
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

export const Skeleton: FC<SkeletonProps> = ({
  width = 'w-full',
  height = 'h-4',
  rounded = 'md',
}) => {
  const roundedClass = {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-card',
    full: 'rounded-full',
  }[rounded]

  return (
    <View
      className={[
        width,
        height,
        roundedClass,
        'bg-neu-dark/20 dark:bg-neu-d-dark/20',
      ].join(' ')}
    />
  )
}

export const TaskCardSkeleton: FC = () => {
  return (
    <View className="bg-neu-bg dark:bg-neu-d-bg rounded-card p-4 gap-3">
      <View className="flex-row items-center gap-3">
        <Skeleton width="w-10" height="h-10" rounded="full" />
        <View className="flex-1 gap-2">
          <Skeleton width="w-3/4" height="h-4" />
          <Skeleton width="w-1/2" height="h-3" />
        </View>
      </View>
    </View>
  )
}
