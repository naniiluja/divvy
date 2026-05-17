import { useEffect, useRef } from 'react'
import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { getTasksForSpace, getRecentCompletions } from '@/lib/api'
import type { Task, TaskCompletion } from '@/types'

interface HistoryData {
  tasks: Task[]
  completions: TaskCompletion[]
}

export interface UseHistoryResult {
  tasks: Task[]
  completions: TaskCompletion[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useHistory(spaceId: string | null): UseHistoryResult {
  const { data, isLoading, error, mutate } = useSWR<HistoryData>(
    spaceId ? ['history', spaceId] : null,
    async () => {
      const [tasks, completions] = await Promise.all([
        getTasksForSpace(spaceId!),
        getRecentCompletions(spaceId!, 7),
      ])
      return { tasks, completions }
    },
  )

  const mutateRef = useRef(mutate)
  mutateRef.current = mutate

  useEffect(() => {
    if (!spaceId) return

    const channel = supabase
      .channel(`history:${spaceId}:${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_completions', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          mutateRef.current((prev) => {
            if (!prev) return prev
            if (payload.eventType === 'INSERT')
              return { ...prev, completions: [payload.new as TaskCompletion, ...prev.completions] }
            return prev
          }, { revalidate: false })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [spaceId])

  return {
    tasks: data?.tasks ?? [],
    completions: data?.completions ?? [],
    isLoading,
    error: error ?? null,
    refetch: () => { if (spaceId) mutate() },
  }
}
