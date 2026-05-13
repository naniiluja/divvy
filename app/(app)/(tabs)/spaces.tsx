import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { EmptyState } from '@/components/layout/EmptyState'

export default function SpacesScreen() {
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-neu-bg dark:bg-neu-d-bg">
      <ScreenHeader
        title="Spaces"
        rightAction={{
          label: '+ Tạo',
          onPress: () => router.push('/(app)/space/new'),
        }}
      />
      <EmptyState
        emoji="🏘️"
        title="Chưa có Space nào"
        description="Tạo Space để bắt đầu. Mời thành viên qua link."
        actionLabel="Tạo Space"
        onAction={() => router.push('/(app)/space/new')}
      />
    </SafeAreaView>
  )
}
