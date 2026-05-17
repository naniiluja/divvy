import type { StateCreator } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'

export interface SessionSlice {
  session: Session | null
  user: User | null
  isSessionLoading: boolean
  setSession: (session: Session | null) => void
  setSessionLoading: (loading: boolean) => void
  clearSession: () => void
}

export const createSessionSlice: StateCreator<SessionSlice, [], [], SessionSlice> = (set) => ({
  session: null,
  user: null,
  isSessionLoading: true,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setSessionLoading: (loading) => set({ isSessionLoading: loading }),
  clearSession: () => set({ session: null, user: null }),
})
