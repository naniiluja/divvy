import { useEffect, useRef, useState } from 'react'
import { Alert, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import Svg, { Circle } from 'react-native-svg'
import { SpaceHeader } from '@/components/space/SpaceHeader'
import { TaskCard } from '@/components/task/TaskCard'
import { TaskCardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/layout/EmptyState'
import { useStore } from '@/stores'
import { supabase } from '@/lib/supabase'
import {
  getSpaceById,
  getTasksForSpace,
  getTodayCompletions,
  addCompletion,
  skipTask,
} from '@/lib/api'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import type { Space, Task, TaskCompletion } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

function ProgressRing({ pct }: { pct: number }) {
  const size = 50
  const strokeW = 3
  const r = (size - strokeW * 2) / 2
  const C = 2 * Math.PI * r
  const dash = (pct / 100) * C
  return (
    <View style={[styles.ringWrap, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.ringAbsolute}>
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#6C7CFF" strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={styles.ringPct}>{pct}<Text style={styles.ringPctSmall}>%</Text></Text>
    </View>
  )
}

export default function HomeScreen() {
  const router = useRouter()
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const userId = useStore((s) => s.user?.id)
  const userProfile = useStore((s) => s.user)

  const [space, setSpace] = useState<Space | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [completions, setCompletions] = useState<TaskCompletion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const channelRef = useRef<RealtimeChannel | null>(null)

  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })

  useEffect(() => {
    if (!activeSpaceId || !userId) {
      setSpace(null); setTasks([]); setCompletions([])
      return
    }
    setIsLoading(true)
    Promise.all([
      getSpaceById(activeSpaceId),
      getTasksForSpace(activeSpaceId),
      getTodayCompletions(activeSpaceId),
    ])
      .then(([spaceData, taskData, completionData]) => {
        setSpace(spaceData); setTasks(taskData); setCompletions(completionData)
      })
      .catch(() => Alert.alert('Lỗi', 'Không thể tải dữ liệu'))
      .finally(() => setIsLoading(false))

    channelRef.current?.unsubscribe()
    channelRef.current = supabase
      .channel(`home-${activeSpaceId}-completions`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_completions', filter: `space_id=eq.${activeSpaceId}` },
        (payload) => {
          const incoming = payload.new as TaskCompletion
          setCompletions((prev) => {
            const without = prev.filter((c) => c.task_id !== incoming.task_id)
            return [incoming, ...without]
          })
        })
      .subscribe()

    return () => { channelRef.current?.unsubscribe() }
  }, [activeSpaceId, userId])

  const handleTick = async (taskId: string) => {
    if (!activeSpaceId || !userId) return
    const alreadyDone = completions.find((c) => c.task_id === taskId && !c.is_skipped)
    if (alreadyDone) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    try { await addCompletion(taskId, activeSpaceId, userId) }
    catch (err) { Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể tick task') }
  }

  const handleSkip = async (taskId: string) => {
    if (!activeSpaceId || !userId) return
    try { await skipTask(taskId, activeSpaceId, userId) }
    catch (err) { Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể bỏ qua task') }
  }

  if (!activeSpaceId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <EmptyState
          emoji="🏠"
          title="Chưa có Space nào"
          description="Tạo hoặc tham gia Space để bắt đầu chia sẻ công việc nhà."
          actionLabel="Tạo Space"
          onAction={() => router.push('/(app)/space/new')}
        />
      </SafeAreaView>
    )
  }

  const todoTasks = tasks.filter((t) => !completions.find((c) => c.task_id === t.id && !c.is_skipped))
  const doneTasks = tasks.filter((t) => completions.find((c) => c.task_id === t.id && !c.is_skipped))
  const pct = tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      {space && (
        <SpaceHeader
          space={space}
          onInvitePress={() => router.push(`/(app)/space/invite/${activeSpaceId}` as never)}
        />
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.greetCard, { backgroundColor: c.bg, ...shadow('raised', 'md') }]}>
          <View style={styles.greetTop}>
            <View>
              <Text style={[styles.greetDate, { color: c.textMid }]}>
                Hôm nay · {today.split(',')[0]}
              </Text>
              <Text style={[styles.greetName, { color: c.textDark }]}>
                Xin chào {(userProfile?.user_metadata?.display_name as string | undefined) ?? 'bạn'} 👋
              </Text>
            </View>
            <ProgressRing pct={pct} />
          </View>
          <View style={styles.greetStats}>
            <View style={styles.greetDot}>
              <View style={[styles.dot, { backgroundColor: c.accent }]} />
              <Text style={[styles.greetStatText, { color: c.textMid }]}>
                <Text style={[styles.greetStatBold, { color: c.textDark }]}>{todoTasks.length}</Text> task cần làm
              </Text>
            </View>
            <Text style={[styles.greetDivider, { color: c.textLight }]}>·</Text>
            <Text style={[styles.greetStatText, { color: c.textMid }]}>
              <Text style={[styles.greetStatBold, { color: c.textDark }]}>{doneTasks.length}/{tasks.length}</Text> đã xong
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.skeletons}>
            {[1, 2, 3].map((i) => <TaskCardSkeleton key={i} />)}
          </View>
        ) : (
          <>
            {todoTasks.length > 0 && (
              <>
                <View style={styles.sectionRow}>
                  <Text style={[styles.sectionLabel, { color: c.textMid }]}>CẦN LÀM · {todoTasks.length}</Text>
                  <Pressable
                    onPress={() => router.push('/(app)/task/new')}
                    style={[styles.addBtn, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}
                  >
                    <Text style={[styles.addBtnText, { color: c.textMid }]}>+ Task</Text>
                  </Pressable>
                </View>
                <View style={styles.taskList}>
                  {todoTasks.map((t) => (
                    <TaskCard key={t.id} task={t} lastCompletion={completions.find((c) => c.task_id === t.id) ?? null} onTick={handleTick} onSkip={handleSkip} />
                  ))}
                </View>
              </>
            )}

            {doneTasks.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: c.textMid, marginTop: 22, paddingHorizontal: 6 }]}>ĐÃ XONG · {doneTasks.length}</Text>
                <View style={[styles.taskList, { marginTop: 10 }]}>
                  {doneTasks.map((t) => (
                    <TaskCard key={t.id} task={t} lastCompletion={completions.find((c) => c.task_id === t.id) ?? null} onTick={handleTick} onSkip={handleSkip} />
                  ))}
                </View>
              </>
            )}

            {tasks.length === 0 && (
              <EmptyState
                emoji="✅"
                title="Chưa có task nào"
                description="Thêm task để bắt đầu theo dõi công việc nhà."
                actionLabel="Thêm task"
                onAction={() => router.push('/(app)/task/new')}
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 120, gap: 0 },
  greetCard: { borderRadius: RADIUS.card, padding: 20, marginBottom: 22, gap: 16 },
  greetTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetDate: { fontSize: 11, fontWeight: '600', letterSpacing: 0.88, textTransform: 'uppercase' },
  greetName: { fontSize: 24, fontWeight: '700', letterSpacing: -0.6, marginTop: 2 },
  greetStats: { flexDirection: 'row', alignItems: 'center', gap: 8, fontSize: 13 },
  greetDot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  greetStatText: { fontSize: 13 },
  greetStatBold: { fontWeight: '600' },
  greetDivider: { fontSize: 13 },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ringAbsolute: { position: 'absolute' },
  ringPct: { fontSize: 12, fontWeight: '700', letterSpacing: -0.3 },
  ringPctSmall: { fontSize: 8 },
  skeletons: { gap: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  addBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill },
  addBtnText: { fontSize: 12, fontWeight: '600' },
  taskList: { gap: 10 },
})
