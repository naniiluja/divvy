import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

export default function SpaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  return (
    <SafeAreaView className="flex-1 bg-neu-bg dark:bg-neu-d-bg">
      <ScreenHeader title="Space" showBack />
      <View className="flex-1 items-center justify-center">
        <Text className="text-text-mid dark:text-text-mid-d font-body">
          Space {id} — Phase 2
        </Text>
      </View>
    </SafeAreaView>
  )
}
