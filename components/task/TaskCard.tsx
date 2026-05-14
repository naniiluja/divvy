import { useRef } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { FC } from 'react'
import * as Haptics from 'expo-haptics'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import type { Task, TaskCompletion } from '@/types'

const FREQ_LABEL: Record<string, string> = {
  daily: 'Hằng ngày',
  weekly: 'Hằng tuần',
  '3x_week': '3 lần/tuần',
  '2x_week': '2 lần/tuần',
}

interface TaskCardProps {
  task: Task
  lastCompletion?: TaskCompletion | null
  onTick: (taskId: string) => void
  onSkip: (taskId: string) => void
}

export const TaskCard: FC<TaskCardProps> = ({ task, lastCompletion, onTick, onSkip }) => {
  const isDone = lastCompletion && !lastCompletion.is_skipped
  const isSkipped = lastCompletion?.is_skipped

  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const handleTick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onTick(task.id)
  }

  return (
    <Pressable
      onLongPress={() => onSkip(task.id)}
      delayLongPress={400}
      style={[
        styles.card,
        { backgroundColor: c.bg },
        isDone ? shadow('inset', 'sm') : shadow('raised', 'sm'),
        { opacity: isDone ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
        <Text style={styles.iconText}>{task.icon}</Text>
      </View>

      <View style={styles.info}>
        <Text
          style={[
            styles.name,
            { color: c.textDark },
            isDone && styles.nameDone,
          ]}
          numberOfLines={1}
        >
          {task.name}
        </Text>
        <View style={styles.meta}>
          {isDone && lastCompletion ? (
            <Text style={[styles.metaText, { color: c.textMid }]}>
              Xong · {new Date(lastCompletion.completed_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          ) : isSkipped ? (
            <Text style={[styles.metaText, { color: c.textMid }]}>Bỏ qua</Text>
          ) : (
            <Text style={[styles.metaText, { color: c.textMid }]}>
              {FREQ_LABEL[task.frequency] ?? task.frequency}
              {task.assignee_id ? '' : ' · Ai cũng được'}
            </Text>
          )}
        </View>
      </View>

      <Pressable
        onPress={handleTick}
        style={[
          styles.tickBtn,
          { backgroundColor: isDone ? c.accent : c.bg },
          isDone ? shadow('accent', 'sm') : shadow('inset', 'sm'),
        ]}
      >
        {isDone && (
          <Text style={styles.checkMark}>✓</Text>
        )}
        {isSkipped && !isDone && (
          <Text style={[styles.checkMark, { color: c.textLight }]}>–</Text>
        )}
      </Pressable>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: { fontSize: 22 },
  info: { flex: 1, minWidth: 0, gap: 3 },
  name: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
  nameDone: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 11 },
  tickBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkMark: { fontSize: 14, color: '#fff', fontWeight: '700' },
})
