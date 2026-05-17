import type { StateCreator } from 'zustand'

export type ActiveSheet = 'none' | 'ai-generate' | 'task-detail' | 'invite'

export const ACCENT_COLORS = {
  violet: '#6C7CFF',
  rose:   '#F472B6',
  teal:   '#2DD4BF',
  amber:  '#FBBF24',
  emerald:'#34D399',
} as const

export type AccentKey = keyof typeof ACCENT_COLORS

export interface UiSlice {
  activeSheet: ActiveSheet
  themeOverride: 'system' | 'light' | 'dark'
  accentKey: AccentKey
  toast: string | null
  setActiveSheet: (sheet: ActiveSheet) => void
  setThemeOverride: (mode: 'system' | 'light' | 'dark') => void
  setAccentKey: (key: AccentKey) => void
  showToast: (msg: string) => void
  clearToast: () => void
}

export const createUiSlice: StateCreator<UiSlice, [], [], UiSlice> = (set) => ({
  activeSheet: 'none',
  themeOverride: 'system',
  accentKey: 'violet',
  toast: null,
  setActiveSheet: (sheet) => set({ activeSheet: sheet }),
  setThemeOverride: (mode) => set({ themeOverride: mode }),
  setAccentKey: (key) => set({ accentKey: key }),
  showToast: (msg) => set({ toast: msg }),
  clearToast: () => set({ toast: null }),
})
