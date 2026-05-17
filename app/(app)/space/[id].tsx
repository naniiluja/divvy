import { Alert } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { SpaceHeader } from '@/components/space/SpaceHeader'
import { TaskList } from '@/components/task/TaskList'
import { useStore } from '@/stores'
import { useTasks } from '@/hooks/useTasks'
import { useSpace } from '@/hooks/useSpace'
import { addCompletion, skipTask } from '@/lib/api'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function SpaceDetailScreen() {
  const { id: spaceId } = useLocalSearchParams<{ id: string }>()
  const userId = useStore((s) => s.user?.id)

  const isValidId = Boolean(spaceId && UUID_RE.test(spaceId))
  const resolvedId = isValidId ? spaceId : null

  const { spaces } = useSpace()
  const space = spaces.find((s) => s.id === resolvedId) ?? null
  const { tasks, completions, isLoading } = useTasks(resolvedId)

  const handleTick = async (taskId: string): Promise<void> => {
    if (!resolvedId || !userId) return
    const alreadyDone = completions.find((c) => c.task_id === taskId && !c.is_skipped)
    if (alreadyDone) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    try {
      await addCompletion(taskId, resolvedId, userId)
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể tick task')
    }
  }

  const handleSkip = async (taskId: string): Promise<void> => {
    if (!resolvedId || !userId) return
    try {
      await skipTask(taskId, resolvedId, userId)
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể bỏ qua task')
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neu-bg dark:bg-neu-d-bg">
      <ScreenHeader title={space?.name ?? 'Space'} showBack />
      {space && <SpaceHeader space={space} />}
      <TaskList
        tasks={tasks}
        completions={completions}
        isLoading={isLoading}
        onTick={handleTick}
        onLongPress={(task) => handleSkip(task.id)}
      />
    </SafeAreaView>
  )
}
