import { useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { SpaceHeader } from '@/components/space/SpaceHeader'
import { TaskList } from '@/components/task/TaskList'
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function SpaceDetailScreen() {
  const { id: spaceId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const userId = useStore((s) => s.user?.id)

  const [space, setSpace] = useState<Space | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [completions, setCompletions] = useState<TaskCompletion[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const channelRef = useRef<RealtimeChannel | null>(null)

  const isValidId = spaceId && UUID_RE.test(spaceId)

  useEffect(() => {
    if (!isValidId || !userId) {
      setIsLoading(false)
      return
    }

    Promise.all([
      getSpaceById(spaceId),
      getTasksForSpace(spaceId),
      getTodayCompletions(spaceId),
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

    channelRef.current = supabase
      .channel(`space-${spaceId}-completions`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_completions',
          filter: `space_id=eq.${spaceId}`,
        },
        (payload) => {
          const newCompletion = payload.new as TaskCompletion
          setCompletions((prev) => {
            const without = prev.filter((c) => c.task_id !== newCompletion.task_id)
            return [newCompletion, ...without]
          })
        },
      )
      .subscribe()

    return () => {
      channelRef.current?.unsubscribe()
    }
  }, [spaceId, userId, isValidId])

  const handleTick = async (taskId: string) => {
    if (!spaceId || !userId) return
    const alreadyDone = completions.find(
      (c) => c.task_id === taskId && !c.is_skipped,
    )
    if (alreadyDone) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    try {
      await addCompletion(taskId, spaceId, userId)
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể tick task')
    }
  }

  const handleSkip = async (taskId: string) => {
    if (!spaceId || !userId) return
    try {
      await skipTask(taskId, spaceId, userId)
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể bỏ qua task')
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neu-bg dark:bg-neu-d-bg">
      <ScreenHeader title={space?.name ?? 'Space'} showBack />
      {space && (
        <SpaceHeader
          space={space}
          onInvitePress={() => router.push(`/(app)/space/invite/${spaceId}` as never)}
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
