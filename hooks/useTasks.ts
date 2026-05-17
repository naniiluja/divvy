import { useEffect } from 'react'
import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { getTasksForSpace, getTodayCompletions } from '@/lib/api'
import type { Task, TaskCompletion } from '@/types'

interface TasksData {
  tasks: Task[]
  completions: TaskCompletion[]
}

export function useTasks(spaceId: string | null): {
  tasks: Task[]
  completions: TaskCompletion[]
  isLoading: boolean
  error: Error | null
  removeCompletion: (completionId: string) => void
  refresh: () => void
} {
  const { data, isLoading, error, mutate } = useSWR<TasksData>(
    spaceId ? ['tasks', spaceId] : null,
    async () => {
      const [tasks, completions] = await Promise.all([
        getTasksForSpace(spaceId!),
        getTodayCompletions(spaceId!),
      ])
      return { tasks, completions }
    },
  )

  useEffect(() => {
    if (!spaceId) return

    const channel = supabase
      .channel(`task_completions:${spaceId}:${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_completions', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          mutate((prev) => {
            if (!prev) return prev
            if (payload.eventType === 'INSERT') {
              return { ...prev, completions: [payload.new as TaskCompletion, ...prev.completions] }
            }
            if (payload.eventType === 'DELETE') {
              return { ...prev, completions: prev.completions.filter((c) => c.id !== payload.old.id) }
            }
            return prev
          }, { revalidate: false })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [spaceId, mutate])

  function removeCompletion(completionId: string) {
    mutate((prev) => {
      if (!prev) return prev
      return { ...prev, completions: prev.completions.filter((c) => c.id !== completionId) }
    }, { revalidate: false })
  }

  return {
    tasks: data?.tasks ?? [],
    completions: data?.completions ?? [],
    isLoading,
    error: error ?? null,
    removeCompletion,
    refresh: mutate,
  }
}
