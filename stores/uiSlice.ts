import type { StateCreator } from 'zustand'

export type ActiveSheet = 'none' | 'ai-generate' | 'task-detail' | 'invite'

export interface UiSlice {
  isLoading: boolean
  activeSheet: ActiveSheet
  themeOverride: 'system' | 'light' | 'dark'
  setLoading: (loading: boolean) => void
  setActiveSheet: (sheet: ActiveSheet) => void
  setThemeOverride: (mode: 'system' | 'light' | 'dark') => void
}

export const createUiSlice: StateCreator<UiSlice, [], [], UiSlice> = (set) => ({
  isLoading: false,
  activeSheet: 'none',
  themeOverride: 'system',
  setLoading: (loading) => set({ isLoading: loading }),
  setActiveSheet: (sheet) => set({ activeSheet: sheet }),
  setThemeOverride: (mode) => set({ themeOverride: mode }),
})
