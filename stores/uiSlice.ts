import type { StateCreator } from 'zustand'

export type ActiveSheet = 'none' | 'ai-generate' | 'task-detail' | 'invite'

export interface UiSlice {
  isLoading: boolean
  activeSheet: ActiveSheet
  setLoading: (loading: boolean) => void
  setActiveSheet: (sheet: ActiveSheet) => void
}

export const createUiSlice: StateCreator<UiSlice, [], [], UiSlice> = (set) => ({
  isLoading: false,
  activeSheet: 'none',
  setLoading: (loading) => set({ isLoading: loading }),
  setActiveSheet: (sheet) => set({ activeSheet: sheet }),
})
