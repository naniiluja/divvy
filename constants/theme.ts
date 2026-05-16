export interface ThemeColors {
  bg: string
  bg2: string
  textDark: string
  textMid: string
  textLight: string
  accent: string
  accent2: string
  error: string
}

export const LIGHT: ThemeColors = {
  bg: '#E4E9F2',
  bg2: '#D9DFEC',
  textDark: '#2D3454',
  textMid: '#737CA0',
  textLight: '#A6AEC8',
  accent: '#6C7CFF',
  accent2: '#A78BFA',
  error: '#EF4444',
}

export const DARK: ThemeColors = {
  bg: '#262B3D',
  bg2: '#1E2231',
  textDark: '#E8ECF8',
  textMid: '#9DA5C2',
  textLight: '#5C6584',
  accent: '#6C7CFF',
  accent2: '#A78BFA',
  error: '#EF4444',
}

export const colors = { light: LIGHT, dark: DARK } as const

export const RADIUS = {
  card: 28,
  input: 20,
  pill: 999,
  chip: 16,
  avatar: 999,
} as const

export const radius = {
  card: 28,
  input: 20,
  pill: 999,
  smallCard: 14,
  tab: 22,
} as const

export const font = {
  display: 'PlusJakartaSans_700Bold',
  body: 'PlusJakartaSans_500Medium',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
} as const

export const shadowSizes = {
  sm: { offset: 3, blur: 6, spread: 0 },
  md: { offset: 6, blur: 12, spread: 0 },
  lg: { offset: 10, blur: 20, spread: 0 },
} as const
