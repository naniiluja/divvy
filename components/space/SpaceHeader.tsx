import { View, Text, Pressable } from 'react-native'
import type { FC } from 'react'
import type { Space } from '@/types'

interface SpaceHeaderProps {
  space: Space
  onInvitePress: () => void
}

export const SpaceHeader: FC<SpaceHeaderProps> = ({ space, onInvitePress }) => {
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <View className="flex-row items-center gap-3">
        <Text className="text-3xl">{space.emoji}</Text>
        <Text className="text-text-dark dark:text-text-dark-d text-lg font-display">
          {space.name}
        </Text>
      </View>
      <Pressable
        onPress={onInvitePress}
        className="min-h-[44px] min-w-[44px] items-center justify-center px-3 rounded-pill bg-accent/10"
      >
        <Text className="text-accent text-sm font-body">+ Mời</Text>
      </Pressable>
    </View>
  )
}
