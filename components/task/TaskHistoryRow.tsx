import { View, Text } from 'react-native'
import type { FC } from 'react'
import type { TaskCompletion } from '@/types'

interface TaskHistoryRowProps {
  completion: TaskCompletion
  taskName?: string
  taskIcon?: string
}

export const TaskHistoryRow: FC<TaskHistoryRowProps> = ({
  completion,
  taskName,
  taskIcon,
}) => {
  const date = new Date(completion.completed_at)

  return (
    <View className="flex-row items-center gap-3 py-3 border-b border-neu-dark/10 dark:border-neu-d-dark/10">
      <Text className="text-2xl">{taskIcon ?? '📋'}</Text>
      <View className="flex-1 gap-0.5">
        <Text className="text-text-dark dark:text-text-dark-d text-sm font-body">
          {taskName ?? 'Task'}
        </Text>
        <Text className="text-text-light dark:text-text-light-d text-xs font-body">
          {date.toLocaleDateString('vi-VN', { weekday: 'short', month: 'short', day: 'numeric' })}
          {' · '}
          {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <View
        className={[
          'px-2 py-1 rounded-full',
          completion.is_skipped ? 'bg-warning/20' : 'bg-success/20',
        ].join(' ')}
      >
        <Text
          className={[
            'text-xs font-body',
            completion.is_skipped ? 'text-warning' : 'text-success',
          ].join(' ')}
        >
          {completion.is_skipped ? 'Bỏ qua' : 'Xong'}
        </Text>
      </View>
    </View>
  )
}
