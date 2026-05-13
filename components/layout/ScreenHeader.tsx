import { View, Text, Pressable } from 'react-native'
import type { FC } from 'react'
import { useRouter } from 'expo-router'

interface ScreenHeaderProps {
  title: string
  showBack?: boolean
  rightAction?: {
    label: string
    onPress: () => void
  }
}

export const ScreenHeader: FC<ScreenHeaderProps> = ({
  title,
  showBack = false,
  rightAction,
}) => {
  const router = useRouter()

  return (
    <View className="flex-row items-center justify-between px-4 py-3 min-h-[56px]">
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          className="min-w-[44px] min-h-[44px] items-center justify-center"
        >
          <Text className="text-accent text-base font-body">←</Text>
        </Pressable>
      ) : (
        <View className="w-11" />
      )}

      <Text className="text-text-dark dark:text-text-dark-d text-lg font-display flex-1 text-center">
        {title}
      </Text>

      {rightAction ? (
        <Pressable
          onPress={rightAction.onPress}
          className="min-w-[44px] min-h-[44px] items-center justify-center"
        >
          <Text className="text-accent text-sm font-body">{rightAction.label}</Text>
        </Pressable>
      ) : (
        <View className="w-11" />
      )}
    </View>
  )
}
