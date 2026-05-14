import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import type { FC } from 'react'
import type { Space } from '@/types'

interface SpaceHeaderProps {
  space: Space
  onInvitePress: () => void
}

export const SpaceHeader: FC<SpaceHeaderProps> = ({ space, onInvitePress }) => {
  const router = useRouter()

  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <View className="flex-row items-center gap-3">
        <Text className="text-3xl">{space.emoji}</Text>
        <Text className="text-text-dark dark:text-text-dark-d text-lg font-display">
          {space.name}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => router.push('/(app)/notifications' as never)}
          className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full"
        >
          <Text className="text-xl">🔔</Text>
        </Pressable>
        <Pressable
          onPress={onInvitePress}
          className="min-h-[44px] min-w-[44px] items-center justify-center px-3 rounded-pill bg-accent/10"
        >
          <Text className="text-accent text-sm font-body">+ Mời</Text>
        </Pressable>
      </View>
    </View>
  )
}
