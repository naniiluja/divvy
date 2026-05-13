import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { EmptyState } from '@/components/layout/EmptyState'
import { useSpace } from '@/hooks/useSpace'

export default function HomeScreen() {
  const router = useRouter()
  const { activeSpaceId } = useSpace()

  if (!activeSpaceId) {
    return (
      <SafeAreaView className="flex-1 bg-neu-bg dark:bg-neu-d-bg">
        <ScreenHeader title="Hôm nay" />
        <EmptyState
          emoji="🏠"
          title="Chưa có Space nào"
          description="Tạo hoặc tham gia Space để bắt đầu chia sẻ công việc nhà."
          actionLabel="Tạo Space"
          onAction={() => router.push('/(app)/space/new')}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-neu-bg dark:bg-neu-d-bg">
      <ScreenHeader title="Hôm nay" />
      <View className="flex-1 items-center justify-center">
        <Text className="text-text-mid dark:text-text-mid-d font-body text-base">
          Tasks sẽ hiển thị ở đây (Phase 3)
        </Text>
      </View>
    </SafeAreaView>
  )
}
