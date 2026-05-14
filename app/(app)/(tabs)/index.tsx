import { useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { SpaceHeader } from '@/components/space/SpaceHeader'
import { TaskList } from '@/components/task/TaskList'
import { EmptyState } from '@/components/layout/EmptyState'
import { useStore } from '@/stores'
import { supabase } from '@/lib/supabase'
import {
  getSpaceById,
  getTasksForSpace,
  getTodayCompletions,
  addCompletion,
  skipTask,
} from '@/lib/api'
import type { Space, Task, TaskCompletion } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export default function HomeScreen() {
  const router = useRouter()
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const userId = useStore((s) => s.user?.id)

  const [space, setSpace] = useState<Space | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [completions, setCompletions] = useState<TaskCompletion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!activeSpaceId || !userId) {
      setSpace(null)
      setTasks([])
      setCompletions([])
      return
    }

    setIsLoading(true)

    Promise.all([
      getSpaceById(activeSpaceId),
      getTasksForSpace(activeSpaceId),
      getTodayCompletions(activeSpaceId),
    ])
      .then(([spaceData, taskData, completionData]) => {
        setSpace(spaceData)
        setTasks(taskData)
        setCompletions(completionData)
      })
      .catch(() => {
        Alert.alert('Lỗi', 'Không thể tải dữ liệu')
      })
      .finally(() => setIsLoading(false))

    channelRef.current?.unsubscribe()
    channelRef.current = supabase
      .channel(`home-${activeSpaceId}-completions`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_completions',
          filter: `space_id=eq.${activeSpaceId}`,
        },
        (payload) => {
          const incoming = payload.new as TaskCompletion
          setCompletions((prev) => {
            const without = prev.filter((c) => c.task_id !== incoming.task_id)
            return [incoming, ...without]
          })
        },
      )
      .subscribe()

    return () => {
      channelRef.current?.unsubscribe()
    }
  }, [activeSpaceId, userId])

  const handleTick = async (taskId: string) => {
    if (!activeSpaceId || !userId) return
    const alreadyDone = completions.find((c) => c.task_id === taskId && !c.is_skipped)
    if (alreadyDone) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    try {
      await addCompletion(taskId, activeSpaceId, userId)
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể tick task')
    }
  }

  const handleSkip = async (taskId: string) => {
    if (!activeSpaceId || !userId) return
    try {
      await skipTask(taskId, activeSpaceId, userId)
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể bỏ qua task')
    }
  }

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
      <ScreenHeader
        title="Hôm nay"
        rightAction={{
          label: '+ Task',
          onPress: () => router.push('/(app)/task/new'),
        }}
      />
      {space && (
        <SpaceHeader
          space={space}
          onInvitePress={() => router.push(`/(app)/space/invite/${activeSpaceId}` as never)}
        />
      )}
      <TaskList
        tasks={tasks}
        completions={completions}
        isLoading={isLoading}
        onTick={handleTick}
        onSkip={handleSkip}
      />
    </SafeAreaView>
  )
}
