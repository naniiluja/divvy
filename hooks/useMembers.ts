import useSWR from 'swr'
import { getSpaceById, getSpaceMembers, getTodayCompletions, getTasksForSpace } from '@/lib/api'
import type { Space, SpaceMember, Task, TaskCompletion } from '@/types'

export interface MemberStat {
  user_id: string
  role: 'owner' | 'member'
  displayName: string
  emoji: string
  doneToday: number
  totalToday: number
}

interface MembersData {
  space: Space | null
  members: SpaceMember[]
  completions: TaskCompletion[]
  tasks: Task[]
}

export interface UseMembersResult {
  space: Space | null
  members: SpaceMember[]
  memberStats: MemberStat[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useMembers(spaceId: string | null): UseMembersResult {
  const { data, isLoading, error, mutate } = useSWR<MembersData>(
    spaceId ? ['members-detail', spaceId] : null,
    async () => {
      const [space, members, completions, tasks] = await Promise.all([
        getSpaceById(spaceId!),
        getSpaceMembers(spaceId!),
        getTodayCompletions(spaceId!),
        getTasksForSpace(spaceId!),
      ])
      return { space, members, completions, tasks }
    },
  )

  const tasks = data?.tasks ?? []
  const completions = data?.completions ?? []

  const memberStats: MemberStat[] = (data?.members ?? [])
    .map((m) => {
      const myTasks = tasks.filter((t) => !t.assignee_id || t.assignee_id === m.user_id)
      const totalToday = myTasks.length
      const doneToday = completions.filter((c) => c.completed_by === m.user_id && !c.is_skipped).length
      return {
        user_id: m.user_id,
        role: m.role,
        displayName: m.profiles?.display_name || 'Thành viên',
        emoji: m.profiles?.avatar_emoji || '👤',
        doneToday,
        totalToday,
      }
    })
    .sort((a, b) => b.doneToday - a.doneToday)

  return {
    space: data?.space ?? null,
    members: data?.members ?? [],
    memberStats,
    isLoading,
    error: error ?? null,
    refetch: () => { if (spaceId) mutate() },
  }
}
