import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

export default function NewTaskScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neu-bg dark:bg-neu-d-bg">
      <ScreenHeader title="Tạo Task mới" showBack />
      <View className="flex-1 items-center justify-center">
        <Text className="text-text-mid dark:text-text-mid-d font-body">
          Tạo task — Phase 3
        </Text>
      </View>
    </SafeAreaView>
  )
}
