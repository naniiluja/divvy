import { View, Text, Pressable, StyleSheet, Animated } from 'react-native'
import type { FC } from 'react'
import { useRef, useEffect } from 'react'
import * as Haptics from 'expo-haptics'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import type { Task, TaskCompletion } from '@/types'

interface TaskCardProps {
  task: Task
  lastCompletion?: TaskCompletion | null
  onTick: (taskId: string) => void
  onUncheck?: (completionId: string) => void
  onPress?: () => void
  onLongPress?: () => void
}

export const TaskCard: FC<TaskCardProps> = ({ task, lastCompletion, onTick, onUncheck, onPress, onLongPress }) => {
  const isDone = lastCompletion && !lastCompletion.is_skipped
  const isSkipped = lastCompletion?.is_skipped

  const { shadow } = useNeumorphic()
  const { c } = useTheme()

  const tickScale = useRef(new Animated.Value(1)).current
  const checkOpacity = useRef(new Animated.Value(isDone ? 1 : 0)).current
  const flyAnim = useRef(new Animated.Value(0)).current

  const flyTranslateY = flyAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 48] })
  const flyOpacity = flyAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 0.8, 0] })

  const prevIsDone = useRef(isDone)

  useEffect(() => {
    if (isDone && !prevIsDone.current) {
      flyAnim.setValue(0)
      Animated.parallel([
        Animated.sequence([
          Animated.timing(tickScale, { toValue: 0.8, duration: 80, useNativeDriver: true }),
          Animated.spring(tickScale, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
        ]),
        Animated.timing(checkOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(flyAnim, {
          toValue: 1,
          duration: 520,
          easing: (t) => 1 - Math.pow(1 - t, 4),
          useNativeDriver: true,
        }),
      ]).start()
    } else if (!isDone && prevIsDone.current) {
      flyAnim.setValue(0)
      Animated.timing(checkOpacity, { toValue: 0, duration: 100, useNativeDriver: true }).start()
    }
    prevIsDone.current = isDone
  }, [isDone])

  const handleTick = () => {
    if (isDone && lastCompletion && onUncheck) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onUncheck(lastCompletion.id)
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onTick(task.id)
  }

  return (
    <Animated.View style={{ transform: [{ translateY: flyTranslateY }], opacity: flyOpacity }}>
    <View
      style={[
        styles.card,
        { backgroundColor: c.bg },
        isDone ? shadow('inset', 'sm') : shadow('raised', 'sm'),
      ]}
    >
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        style={styles.cardPressArea}
      >
        <View style={[styles.cardInner, { opacity: isDone ? 0.7 : 1 }]}>
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
                  {task.assignee_id ? 'Của bạn' : 'Ai cũng được'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.tickPlaceholder} />
        </View>
      </Pressable>

      <Pressable
        onPress={handleTick}
        hitSlop={8}
        style={styles.tickAbsolute}
        accessibilityLabel={isDone ? 'Bỏ đánh dấu' : 'Đánh dấu xong'}
      >
        <Animated.View
          style={[
            styles.tickBtn,
            { backgroundColor: isDone ? c.accent : c.bg },
            isDone ? shadow('accent', 'sm') : shadow('inset', 'sm'),
            { transform: [{ scale: tickScale }] },
          ]}
        >
          <Animated.Text style={[styles.checkMark, { opacity: checkOpacity }]}>✓</Animated.Text>
          {isSkipped && !isDone && (
            <Text style={[styles.checkMark, { color: c.textLight }]}>–</Text>
          )}
        </Animated.View>
      </Pressable>
    </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
  },
  cardPressArea: {
    borderRadius: 20,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  tickPlaceholder: {
    width: 32,
    height: 32,
    flexShrink: 0,
  },
  tickAbsolute: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
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
  freqRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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
