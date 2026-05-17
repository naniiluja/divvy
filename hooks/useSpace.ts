import useSWR from 'swr'
import { useStore } from '@/stores'
import { getSpacesForUser, getSpaceMembers } from '@/lib/api'
import type { Space, SpaceMember } from '@/types'

export function useSpace(): {
  activeSpaceId: string | null
  spaces: Space[]
  members: SpaceMember[]
  isLoading: boolean
  error: Error | null
} {
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const userId = useStore((s) => s.user?.id)

  const {
    data: spaces,
    isLoading: spacesLoading,
    error: spacesError,
  } = useSWR<Space[]>(
    userId ? ['spaces', userId] : null,
    () => getSpacesForUser(userId!),
  )

  const {
    data: members,
    isLoading: membersLoading,
    error: membersError,
  } = useSWR<SpaceMember[]>(
    activeSpaceId ? ['members', activeSpaceId] : null,
    () => getSpaceMembers(activeSpaceId!),
  )

  return {
    activeSpaceId,
    spaces: spaces ?? [],
    members: members ?? [],
    isLoading: spacesLoading || membersLoading,
    error: spacesError ?? membersError ?? null,
  }
}
