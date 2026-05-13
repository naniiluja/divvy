import { useState, useEffect } from 'react'
import { useStore } from '@/stores'
import { getSpacesForUser, getSpaceMembers } from '@/lib/api'
import type { Space, SpaceMember } from '@/types'

export function useSpace(): {
  activeSpaceId: string | null
  spaces: Space[]
  members: SpaceMember[]
  isLoading: boolean
  error: string | null
} {
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const userId = useStore((s) => s.user?.id)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [members, setMembers] = useState<SpaceMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    getSpacesForUser(userId)
      .then(setSpaces)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [userId])

  useEffect(() => {
    if (!activeSpaceId) {
      setMembers([])
      return
    }

    getSpaceMembers(activeSpaceId)
      .then(setMembers)
      .catch((err: Error) => setError(err.message))
  }, [activeSpaceId])

  return { activeSpaceId, spaces, members, isLoading, error }
}
