import { supabase } from '@/lib/supabase'
import { useStore } from '@/stores'

export function useTaskActions(): {
  tickTask: (taskId: string, spaceId: string) => Promise<void>
  skipTask: (taskId: string, spaceId: string) => Promise<void>
} {
  const userId = useStore((s) => s.user?.id)

  const tickTask = async (taskId: string, spaceId: string): Promise<void> => {
    if (!userId) return

    const { error } = await supabase.from('task_completions').insert({
      task_id: taskId,
      space_id: spaceId,
      completed_by: userId,
      is_skipped: false,
    })

    if (error) throw error
  }

  const skipTask = async (taskId: string, spaceId: string): Promise<void> => {
    if (!userId) return

    const { error } = await supabase.from('task_completions').insert({
      task_id: taskId,
      space_id: spaceId,
      completed_by: userId,
      is_skipped: true,
    })

    if (error) throw error
  }

  return { tickTask, skipTask }
}
