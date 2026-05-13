import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getTasksForSpace } from '@/lib/api'
import type { Task, TaskCompletion } from '@/types'

export function useTasks(spaceId: string | null): {
  tasks: Task[]
  completions: TaskCompletion[]
  isLoading: boolean
  error: string | null
} {
  const [tasks, setTasks] = useState<Task[]>([])
  const [completions, setCompletions] = useState<TaskCompletion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!spaceId) {
      setTasks([])
      setCompletions([])
      return
    }

    setIsLoading(true)
    setError(null)

    getTasksForSpace(spaceId)
      .then(setTasks)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false))

    // Realtime subscription on task_completions
    const channel = supabase
      .channel(`task_completions:${spaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_completions',
          filter: `space_id=eq.${spaceId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCompletions((prev) => [payload.new as TaskCompletion, ...prev])
          } else if (payload.eventType === 'DELETE') {
            setCompletions((prev) => prev.filter((c) => c.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [spaceId])

  return { tasks, completions, isLoading, error }
}
