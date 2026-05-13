import { View, Text, Pressable } from 'react-native'
import type { FC } from 'react'
import * as Haptics from 'expo-haptics'
import type { Task, TaskCompletion } from '@/types'

interface TaskCardProps {
  task: Task
  lastCompletion?: TaskCompletion | null
  onTick: (taskId: string) => void
  onSkip: (taskId: string) => void
}

export const TaskCard: FC<TaskCardProps> = ({ task, lastCompletion, onTick, onSkip }) => {
  const isDone = lastCompletion && !lastCompletion.is_skipped
  const isSkipped = lastCompletion?.is_skipped

  const handleTick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onTick(task.id)
  }

  return (
    <Pressable
      onLongPress={() => onSkip(task.id)}
      delayLongPress={400}
      className={[
        'flex-row items-center gap-3 p-4 rounded-card',
        'bg-neu-bg dark:bg-neu-d-bg',
        'border border-neu-dark/10 dark:border-neu-d-dark/10',
      ].join(' ')}
    >
      {/* Tick button */}
      <Pressable
        onPress={handleTick}
        className={[
          'w-12 h-12 rounded-full items-center justify-center',
          isDone
            ? 'bg-success'
            : isSkipped
              ? 'bg-warning/30 border-2 border-warning'
              : 'border-2 border-neu-dark/30 dark:border-neu-d-dark/30',
        ].join(' ')}
      >
        {isDone ? (
          <Text className="text-white text-lg">✓</Text>
        ) : isSkipped ? (
          <Text className="text-warning text-lg">–</Text>
        ) : null}
      </Pressable>

      {/* Task info */}
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg">{task.icon}</Text>
          <Text
            className={[
              'text-base font-body',
              isDone
                ? 'text-text-light dark:text-text-light-d line-through'
                : 'text-text-dark dark:text-text-dark-d',
            ].join(' ')}
          >
            {task.name}
          </Text>
        </View>
        {lastCompletion ? (
          <Text className="text-xs text-text-light dark:text-text-light-d font-body">
            {isDone ? 'Xong' : 'Bỏ qua'} ·{' '}
            {new Date(lastCompletion.completed_at).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        ) : null}
      </View>
    </Pressable>
  )
}
