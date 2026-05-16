import { useState, useEffect } from 'react'
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
} {
  const [stats, setStats] = useState<SpaceStat[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !userId) return
    let cancelled = false
    setIsLoading(true)
    getSpacesForUser(userId)
      .then(async (spaces) => {
        const result = await Promise.all(
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
        if (!cancelled) setStats(result)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [enabled, userId])

  return { stats, isLoading }
}
