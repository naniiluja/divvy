import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

export default function AIGenerateScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neu-bg dark:bg-neu-d-bg">
      <ScreenHeader title="AI Gợi ý Task" showBack />
      <View className="flex-1 items-center justify-center">
        <Text className="text-text-mid dark:text-text-mid-d font-body">
          ✨ AI generate — Phase 4
        </Text>
      </View>
    </SafeAreaView>
  )
}
