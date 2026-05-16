import { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { NHeader } from '@/components/ui/NHeader'
import { NButton } from '@/components/ui/NButton'
import { SkipCoverSheet } from '@/components/task/SkipCoverSheet'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import { useStore } from '@/stores'
import {
  getTaskById,
  getCompletionsForTask,
  getSpaceMembers,
  addCompletion,
  skipTask,
} from '@/lib/api'
import type { Task, TaskCompletion, SpaceMember } from '@/types'

type MemberWithProfile = SpaceMember & { profiles?: { display_name?: string; avatar_emoji?: string } }

const FREQ_LABEL: Record<string, string> = {
  daily: 'Hằng ngày',
  weekly: 'Hằng tuần',
  '3x_week': '3 lần/tuần',
}

const DAY_LABEL = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function buildSevenDayGrid(completions: TaskCompletion[]) {
  const grid: { date: Date; status: 'done' | 'skip' | 'none' }[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const end = new Date(d)
    end.setDate(end.getDate() + 1)
    const match = completions.find((c) => {
      const t = new Date(c.completed_at).getTime()
      return t >= d.getTime() && t < end.getTime()
    })
    grid.push({
      date: d,
      status: !match ? 'none' : match.is_skipped ? 'skip' : 'done',
    })
  }
  return grid
}

function nextDateLabel(task: Task, lastDone?: TaskCompletion) {
  if (!lastDone) return 'Hôm nay'
  const last = new Date(lastDone.completed_at)
  if (task.frequency === 'daily') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (last.getTime() < today.getTime()) return 'Hôm nay'
    const tmr = new Date(today)
    tmr.setDate(tmr.getDate() + 1)
    return `Ngày mai · ${tmr.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}`
  }
  if (task.frequency === 'weekly') {
    const target = new Date(last)
    target.setDate(target.getDate() + 7)
    return `${DAY_LABEL[target.getDay()]} · ${target.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}`
  }
  return 'Mỗi 2-3 ngày'
}

export default function TaskDetailScreen() {
  const router = useRouter()
  const { id: taskId } = useLocalSearchParams<{ id: string }>()
  const userId = useStore((s) => s.user?.id)
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const [task, setTask] = useState<Task | null>(null)
  const [completions, setCompletions] = useState<TaskCompletion[]>([])
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [skipping, setSkipping] = useState(false)
  const [ticking, setTicking] = useState(false)

  useEffect(() => {
    if (!taskId) return
    setIsLoading(true)
    getTaskById(taskId)
      .then(async (t) => {
        if (!t) {
          setIsLoading(false)
          return
        }
        setTask(t)
        const [comp, mem] = await Promise.all([
          getCompletionsForTask(t.id, 7),
          getSpaceMembers(t.space_id),
        ])
        setCompletions(comp)
        setMembers(mem as MemberWithProfile[])
      })
      .finally(() => setIsLoading(false))
  }, [taskId])

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
        <View style={styles.headerRow}>
          <NHeader step={0} total={0} onBack={() => router.back()} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={c.accent} />
        </View>
      </SafeAreaView>
    )
  }

  if (!task) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
        <View style={styles.headerRow}>
          <NHeader step={0} total={0} onBack={() => router.back()} />
        </View>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: c.textMid }]}>Không tìm thấy task.</Text>
        </View>
      </SafeAreaView>
    )
  }

  const grid = buildSevenDayGrid(completions)
  const lastDone = completions.find((c) => !c.is_skipped)
  const assignee = members.find((m) => m.user_id === task.assignee_id)
  const assigneeName = assignee?.profiles?.display_name ?? 'Ai cũng được'
  const assigneeEmoji = assignee?.profiles?.avatar_emoji ?? '✨'

  const handleTick = async () => {
    if (!userId || ticking) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setTicking(true)
    try {
      await addCompletion(task.id, task.space_id, userId)
      router.back()
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể tick task')
    } finally {
      setTicking(false)
    }
  }

  const handleSkip = async (id: string) => {
    if (!userId) return
    try {
      await skipTask(id, task.space_id, userId)
      router.back()
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể bỏ qua task')
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.headerRow}>
        <NHeader step={0} total={0} onBack={() => router.back()} />
        <Pressable
          onPress={() => Alert.alert('Coming soon', 'Sửa task sẽ được thêm ở v1.1.')}
          style={[styles.editBtn, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}
        >
          <Text style={{ fontSize: 18 }}>✏</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.iconShowcase, { backgroundColor: c.bg, ...shadow('raised', 'lg') }]}>
          <Text style={styles.iconEmoji}>{task.icon}</Text>
        </View>

        <Text style={[styles.title, { color: c.textDark }]}>{task.name}</Text>

        <View style={[styles.freqPill, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
          <Text style={[styles.freqPillText, { color: c.accent }]}>
            {FREQ_LABEL[task.frequency] ?? task.frequency}
          </Text>
        </View>

        <View style={styles.tiles}>
          <View style={[styles.tile, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}>
            <Text style={[styles.tileLabel, { color: c.textMid }]}>NGƯỜI LÀM</Text>
            <Text style={[styles.tileValue, { color: c.textDark }]} numberOfLines={1}>
              {assigneeEmoji} {assigneeName}
            </Text>
          </View>
          <View style={[styles.tile, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}>
            <Text style={[styles.tileLabel, { color: c.textMid }]}>TIẾP THEO</Text>
            <Text style={[styles.tileValue, { color: c.textDark }]} numberOfLines={1}>
              {nextDateLabel(task, lastDone)}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMid }]}>LỊCH SỬ 7 NGÀY</Text>
        <View style={styles.daysRow}>
          {grid.map((d, i) => (
            <View
              key={i}
              style={[
                styles.dayTile,
                { backgroundColor: c.bg },
                d.status === 'none' ? shadow('inset', 'sm') : shadow('raised', 'sm'),
              ]}
            >
              <Text style={[styles.dayLabel, { color: c.textMid }]}>{DAY_LABEL[d.date.getDay()]}</Text>
              <Text style={styles.dayStatus}>
                {d.status === 'done' ? '✓' : d.status === 'skip' ? '–' : ' '}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => setSkipping(true)}
          style={[styles.ghostBtn, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}
        >
          <Text style={[styles.ghostText, { color: c.textMid }]}>Mình bận</Text>
        </Pressable>
        <View style={{ flex: 1.3 }}>
          <NButton label="Tick xong ✓" onPress={handleTick} isLoading={ticking} fullWidth />
        </View>
      </View>

      <SkipCoverSheet
        visible={skipping}
        task={task}
        onClose={() => setSkipping(false)}
        onSkip={async (id) => {
          setSkipping(false)
          await handleSkip(id)
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  editBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: 24, paddingBottom: 140, gap: 14, alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 14 },

  iconShowcase: {
    width: 96, height: 96, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  iconEmoji: { fontSize: 48 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.84, textAlign: 'center' },
  freqPill: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: RADIUS.pill,
    alignSelf: 'center',
  },
  freqPillText: { fontSize: 12, fontWeight: '700' },

  tiles: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 6 },
  tile: { flex: 1, borderRadius: 22, padding: 16, gap: 6 },
  tileLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  tileValue: { fontSize: 14, fontWeight: '700' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase',
    alignSelf: 'flex-start', marginTop: 10,
  },
  daysRow: { flexDirection: 'row', gap: 6, alignSelf: 'stretch' },
  dayTile: {
    flex: 1,
    height: 72,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dayLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  dayStatus: { fontSize: 18, fontWeight: '700' },

  footer: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    padding: 24,
    paddingBottom: 32,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  ghostBtn: {
    flex: 1, height: 60, borderRadius: RADIUS.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  ghostText: { fontSize: 14, fontWeight: '600' },
})
