import type { StateCreator } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'

export interface SessionSlice {
  session: Session | null
  user: User | null
  setSession: (session: Session | null) => void
  clearSession: () => void
}

export const createSessionSlice: StateCreator<SessionSlice, [], [], SessionSlice> = (set) => ({
  session: null,
  user: null,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
    }),
  clearSession: () => set({ session: null, user: null }),
})
