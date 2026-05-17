import { useEffect, useRef, useState } from 'react'
import { Alert, View, Text, Pressable, StyleSheet, ScrollView, Animated, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { SpaceHeader } from '@/components/space/SpaceHeader'
import { SpaceSwitcherSheet } from '@/components/space/SpaceSwitcherSheet'
import { TaskCard } from '@/components/task/TaskCard'
import { SkipCoverSheet } from '@/components/task/SkipCoverSheet'
import { TaskCardSkeleton } from '@/components/ui/Skeleton'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { EmptyState } from '@/components/layout/EmptyState'
import { useStore } from '@/stores'
import { getProfile, addCompletion, skipTask, deleteCompletion } from '@/lib/api'
import { useTasks } from '@/hooks/useTasks'
import { useSpace } from '@/hooks/useSpace'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { useTabEnter } from '@/hooks/useTabEnter'
import { useRefresh } from '@/hooks/useRefresh'
import { RADIUS } from '@/constants/theme'
import type { Profile } from '@/types'

export default function HomeScreen() {
  const router = useRouter()
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const userId = useStore((s) => s.user?.id)
  const toast = useStore((s) => s.toast)
  const clearToast = useStore((s) => s.clearToast)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [skipFor, setSkipFor] = useState<string | null>(null)

  const toastAnim = useRef(new Animated.Value(0)).current
  const { shadow } = useNeumorphic()
  const { c } = useTheme()
  const enter = useTabEnter()

  const { tasks, completions, isLoading, removeCompletion, refresh } = useTasks(activeSpaceId)
  const { refreshing, handleRefresh } = useRefresh(refresh)
  const { spaces } = useSpace()
  const space = spaces.find((s) => s.id === activeSpaceId) ?? null

  useEffect(() => {
    if (!toast) return
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(() => clearToast())
  }, [toast])

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      return
    }
    getProfile(userId).then((p) => { if (p) setProfile(p) })
  }, [userId])

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })

  const handleTick = async (taskId: string) => {
    if (!activeSpaceId || !userId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    try { await addCompletion(taskId, activeSpaceId, userId) }
    catch (err) { Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể tick task') }
  }

  const handleSkip = async (taskId: string) => {
    if (!activeSpaceId || !userId) return
    try { await skipTask(taskId, activeSpaceId, userId) }
    catch (err) { Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể bỏ qua task') }
  }

  const handleUncheck = async (completionId: string) => {
    removeCompletion(completionId)
    try { await deleteCompletion(completionId) }
    catch (err) { Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể bỏ tick') }
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

  const myTasks = tasks.filter((t) => !t.assignee_id || t.assignee_id === userId)
  const todoTasks = myTasks.filter((t) => !completions.find((c) => c.task_id === t.id && !c.is_skipped))
  const doneTasks = myTasks.filter((t) => completions.find((c) => c.task_id === t.id && !c.is_skipped))
  const pct = myTasks.length ? Math.round((doneTasks.length / myTasks.length) * 100) : 0
  const skipTask_ = tasks.find((t) => t.id === skipFor) ?? null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      {space && (
        <SpaceHeader space={space} onPressSpace={() => setSwitcherOpen(true)} />
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.accent} />}
      >
        <Animated.View style={{ transform: [{ translateY: enter.translateY }], opacity: enter.opacity }}>
        <View style={[styles.greetCard, { backgroundColor: c.bg, ...shadow('raised', 'md') }]}>
          <View style={styles.greetTop}>
            <View>
              <Text style={[styles.greetDate, { color: c.textMid }]}>
                Hôm nay · {today.split(',')[0]}
              </Text>
              <Text style={[styles.greetName, { color: c.textDark }]}>
                Xin chào {profile?.display_name ?? 'bạn'} 👋
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
              <Text style={[styles.greetStatBold, { color: c.textDark }]}>{doneTasks.length}/{myTasks.length}</Text> đã xong
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.skeletons}>
            {[1, 2, 3].map((i) => <TaskCardSkeleton key={i} />)}
          </View>
        ) : (
          <>
            {myTasks.length > 0 && (
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionLabel, { color: c.textMid }]}>
                  {todoTasks.length > 0 ? `CẦN LÀM · ${todoTasks.length}` : `HÔM NAY · ${myTasks.length}`}
                </Text>
                <Pressable
                  onPress={() => router.push('/(app)/task/new')}
                  style={[styles.addBtn, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}
                >
                  <Text style={[styles.addBtnText, { color: c.textMid }]}>+ Task</Text>
                </Pressable>
              </View>
            )}

            {todoTasks.length > 0 && (
              <View style={styles.taskList}>
                {todoTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    lastCompletion={completions.find((c) => c.task_id === t.id) ?? null}
                    onTick={handleTick}
                    onUncheck={handleUncheck}
                    onPress={() => router.push(`/(app)/task/${t.id}` as never)}
                    onLongPress={() => setSkipFor(t.id)}
                  />
                ))}
              </View>
            )}

            {doneTasks.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: c.textMid, marginTop: 22, paddingHorizontal: 6 }]}>
                  ĐÃ XONG · {doneTasks.length}
                </Text>
                <View style={[styles.taskList, { marginTop: 10 }]}>
                  {doneTasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      lastCompletion={completions.find((c) => c.task_id === t.id && !c.is_skipped) ?? null}
                      onTick={handleTick}
                      onUncheck={handleUncheck}
                      onPress={() => router.push(`/(app)/task/${t.id}` as never)}
                      onLongPress={() => setSkipFor(t.id)}
                    />
                  ))}
                </View>
              </>
            )}

            {myTasks.length === 0 && (
              <View style={[styles.emptyCard, { backgroundColor: c.bg, ...shadow('raised', 'md') }]}>
                <Text style={styles.emptyEmoji}>🏡</Text>
                <Text style={[styles.emptyTitle, { color: c.textDark }]}>Chưa có task nào</Text>
                <Text style={[styles.emptyDesc, { color: c.textMid }]}>
                  Thêm task để bắt đầu theo dõi{'\n'}công việc nhà cùng mọi người.
                </Text>
                <Pressable
                  onPress={() => router.push('/(app)/task/new')}
                  style={[styles.emptyBtn, { backgroundColor: c.accent, ...shadow('accent', 'sm') }]}
                >
                  <Text style={styles.emptyBtnText}>+ Thêm task</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
        </Animated.View>
      </ScrollView>

      <SpaceSwitcherSheet
        visible={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
      />

      <SkipCoverSheet
        visible={skipFor !== null}
        task={skipTask_}
        onClose={() => setSkipFor(null)}
        onSkip={async (taskId) => {
          setSkipFor(null)
          await handleSkip(taskId)
        }}
      />

      {toast && (
        <Animated.View
          style={[
            styles.toastBanner,
            { backgroundColor: c.textDark },
            {
              opacity: toastAnim,
              transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
            },
          ]}
        >
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
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
  skeletons: { gap: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  addBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill },
  addBtnText: { fontSize: 12, fontWeight: '600' },
  taskList: { gap: 10 },
  emptyCard: { borderRadius: 28, padding: 32, marginTop: 8, alignItems: 'center', gap: 10 },
  emptyEmoji: { fontSize: 48, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.4 },
  emptyDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  toastBanner: { position: 'absolute', top: 16, left: 24, right: 24, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', zIndex: 999 },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '700' },
})
