import { useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/stores'

export function useSession(): { session: Session | null; isLoading: boolean } {
  const session = useStore((s) => s.session)
  const setSession = useStore((s) => s.setSession)
  const isLoading = useStore((s) => s.isLoading)
  const setLoading = useStore((s) => s.setLoading)

  useEffect(() => {
    setLoading(true)

    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        setSession(null)
        setLoading(false)
        return
      }
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        setSession(currentSession)
        setLoading(false)
      })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setSession, setLoading])

  return { session, isLoading }
}
