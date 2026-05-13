import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createSessionSlice, type SessionSlice } from './sessionSlice'
import { createSpaceSlice, type SpaceSlice } from './spaceSlice'
import { createUiSlice, type UiSlice } from './uiSlice'

type BoundStore = SessionSlice & SpaceSlice & UiSlice

export const useStore = create<BoundStore>()(
  persist(
    (...args) => ({
      ...createSessionSlice(...args),
      ...createSpaceSlice(...args),
      ...createUiSlice(...args),
    }),
    {
      name: 'divvy-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Persist only session token and active space — not UI state
        session: state.session,
        activeSpaceId: state.activeSpaceId,
      }),
    },
  ),
)
