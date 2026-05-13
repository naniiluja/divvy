import { FlatList, View } from 'react-native'
import type { FC } from 'react'
import { TaskCard } from './TaskCard'
import { TaskCardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/layout/EmptyState'
import type { Task, TaskCompletion } from '@/types'

interface TaskListProps {
  tasks: Task[]
  completions: TaskCompletion[]
  isLoading: boolean
  onTick: (taskId: string) => void
  onSkip: (taskId: string) => void
}

export const TaskList: FC<TaskListProps> = ({
  tasks,
  completions,
  isLoading,
  onTick,
  onSkip,
}) => {
  if (isLoading) {
    return (
      <View className="gap-3 px-4">
        {[1, 2, 3].map((i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </View>
    )
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        emoji="✅"
        title="Chưa có task nào"
        description="Thêm task để bắt đầu theo dõi công việc nhà."
      />
    )
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      contentContainerClassName="gap-3 px-4 pb-8"
      renderItem={({ item }) => {
        const lastCompletion = completions.find((c) => c.task_id === item.id) ?? null
        return (
          <TaskCard
            task={item}
            lastCompletion={lastCompletion}
            onTick={onTick}
            onSkip={onSkip}
          />
        )
      }}
    />
  )
}
