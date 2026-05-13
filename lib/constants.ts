export const TASK_FREQUENCIES = ['daily', 'weekly', '3x_week'] as const
export type TaskFrequency = typeof TASK_FREQUENCIES[number]

export const FREQUENCY_LABELS: Record<TaskFrequency, string> = {
  daily: 'Hàng ngày',
  weekly: 'Hàng tuần',
  '3x_week': '3 lần/tuần',
}

export const EMOJI_AVATAR_OPTIONS = [
  '🌸', '🦊', '🐻', '🦄', '🐼', '🦋',
  '🌻', '🐀', '🌙', '⭐', '🎯', '🔥',
]

export const APP_NAME = 'Divvy'
export const APP_TAGLINE = 'Stop asking. Just check.'
