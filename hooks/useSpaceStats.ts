import useSWR from 'swr'
import { getSpacesForUser, getSpaceMembers, getTasksForSpace, getTodayCompletions } from '@/lib/api'
import type { Space } from '@/types'

export interface SpaceStat {
  space: Space
  memberCount: number
  todoToday: number
}

export function useSpaceStats(userId: string | null, enabled: boolean): {
  stats: SpaceStat[]
  isLoading: boolean
  error: Error | null
} {
  const { data, isLoading, error } = useSWR<SpaceStat[]>(
    enabled && userId ? ['space-stats', userId] : null,
    async ([, uid]) => {
      const spaces = await getSpacesForUser(uid as string)
      return Promise.all(
        spaces.map(async (space) => {
          const [members, tasks, completions] = await Promise.all([
            getSpaceMembers(space.id),
            getTasksForSpace(space.id),
            getTodayCompletions(space.id),
          ])
          const doneToday = new Set(completions.filter((c) => !c.is_skipped).map((c) => c.task_id))
          const todoToday = tasks.filter((t) => !doneToday.has(t.id)).length
          return { space, memberCount: members.length, todoToday }
        }),
      )
    },
  )

  return {
    stats: data ?? [],
    isLoading,
    error: error ?? null,
  }
}
