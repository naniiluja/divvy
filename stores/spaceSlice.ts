import type { StateCreator } from 'zustand'

export interface SpaceSlice {
  activeSpaceId: string | null
  setActiveSpaceId: (id: string | null) => void
}

export const createSpaceSlice: StateCreator<SpaceSlice, [], [], SpaceSlice> = (set) => ({
  activeSpaceId: null,
  setActiveSpaceId: (id) => set({ activeSpaceId: id }),
})
