import { useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/stores'

export function useSession(): {
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
} {
  const session = useStore((s) => s.session)
  const isLoading = useStore((s) => s.isSessionLoading)
  const setSession = useStore((s) => s.setSession)
  const setSessionLoading = useStore((s) => s.setSessionLoading)

  useEffect(() => {
    setSessionLoading(true)

    // getUser() validates the token with the server; getSession() returns the cached session.
    // Validate first, then fetch the session if a user is present.
    supabase.auth.getUser().then(async ({ data: { user }, error }) => {
      if (error || !user) {
        setSession(null)
      } else {
        const { data } = await supabase.auth.getSession()
        setSession(data.session)
      }
      setSessionLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setSession, setSessionLoading])

  return { session, isLoading, isAuthenticated: !!session }
}
