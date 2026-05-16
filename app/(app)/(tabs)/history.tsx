import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useStore } from '@/stores'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import { getRecentCompletions, getTasksForSpace } from '@/lib/api'
import type { Task, TaskCompletion } from '@/types'

const DAY_LABEL = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Hôm nay'
  if (diff === 1) return 'Hôm qua'
  if (diff < 7) return `${diff} ngày trước`
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })
}

export default function HistoryScreen() {
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const [tasks, setTasks] = useState<Task[]>([])
  const [completions, setCompletions] = useState<TaskCompletion[]>([])

  useEffect(() => {
    if (!activeSpaceId) return
    Promise.all([
      getTasksForSpace(activeSpaceId),
      getRecentCompletions(activeSpaceId, 7),
    ]).then(([t, c]) => { setTasks(t); setCompletions(c) })
  }, [activeSpaceId])

  const grouped = completions.reduce<Record<string, TaskCompletion[]>>((acc, c) => {
    const key = new Date(c.completed_at).toDateString()
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  const days = Object.entries(grouped).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())

  // Consecutive streak: walk back day-by-day from today until a day has zero non-skipped completions
  const activeKeySet = new Set(
    completions
      .filter((c) => !c.is_skipped)
      .map((c) => new Date(c.completed_at).toDateString()),
  )
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  while (activeKeySet.has(cursor.toDateString())) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: c.textDark }]}>Lịch sử 7 ngày</Text>
        <Text style={[styles.subtitle, { color: c.textMid }]}>Ai làm gì, lúc mấy giờ.</Text>

        <View style={[styles.streakCard, { backgroundColor: c.bg, ...shadow('raised', 'md') }]}>
          <View style={[styles.streakIcon, { backgroundColor: c.accent, ...shadow('accent', 'sm') }]}>
            <Text style={{ fontSize: 26 }}>🔥</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.streakSub, { color: c.textMid }]}>Cả Space đang giữ</Text>
            <Text style={[styles.streakCount, { color: c.textDark }]}>
              {streak} ngày streak{' '}
              <Text style={[styles.streakLabel, { color: c.textMid }]}>· liên tiếp</Text>
            </Text>
          </View>
        </View>

        {days.map(([dateKey, items]) => {
          const d = new Date(dateKey)
          return (
            <View key={dateKey} style={styles.dayBlock}>
              <View style={styles.dayHeader}>
                <View style={[styles.dayPill, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
                  <Text style={[styles.dayPillText, { color: c.textMid }]}>{DAY_LABEL[d.getDay()]}</Text>
                </View>
                <View>
                  <Text style={[styles.dayLabel, { color: c.textDark }]}>{getDayLabel(dateKey)}</Text>
                  <Text style={[styles.dayCount, { color: c.textMid }]}>{items.length} hoạt động</Text>
                </View>
              </View>
              <View style={[styles.timeline, { marginLeft: 9 }]}>
                <View style={[styles.timelineLine, { backgroundColor: c.bg2 }]} />
                <View style={styles.eventList}>
                  {items.map((item) => {
                    const task = tasks.find((t) => t.id === item.task_id)
                    return (
                      <View key={item.id} style={[styles.eventCard, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}>
                        <View style={[styles.eventIcon, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
                          <Text style={{ fontSize: 16 }}>{task?.icon ?? '📋'}</Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.eventName, { color: c.textDark }]} numberOfLines={1}>
                            {task?.name ?? 'Task'}
                          </Text>
                          <Text style={[styles.eventMeta, { color: c.textMid }]}>
                            {new Date(item.completed_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            {item.is_skipped && ' · Bỏ qua'}
                          </Text>
                        </View>
                        <View style={[styles.checkDot, { backgroundColor: item.is_skipped ? c.textLight : c.accent, ...shadow('accent', 'sm') }]}>
                          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{item.is_skipped ? '–' : '✓'}</Text>
                        </View>
                      </View>
                    )
                  })}
                </View>
              </View>
            </View>
          )
        })}

        {days.length === 0 && (
          <Text style={[styles.empty, { color: c.textLight }]}>Chưa có hoạt động nào.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 120, gap: 0 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.65 },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 18 },
  streakCard: { borderRadius: RADIUS.card, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
  streakIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  streakSub: { fontSize: 13 },
  streakCount: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  streakLabel: { fontSize: 13, fontWeight: '500' },
  dayBlock: { marginBottom: 16 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  dayPill: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayPillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  dayLabel: { fontSize: 14, fontWeight: '700' },
  dayCount: { fontSize: 11 },
  timeline: { position: 'relative' },
  timelineLine: { position: 'absolute', left: 9, top: -10, bottom: -10, width: 2, borderRadius: 1 },
  eventList: { gap: 8, marginLeft: 14 },
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, paddingHorizontal: 14, borderRadius: 16 },
  eventIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  eventName: { fontSize: 13, fontWeight: '600' },
  eventMeta: { fontSize: 11 },
  checkDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
})
