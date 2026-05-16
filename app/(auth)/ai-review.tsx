import { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet, Animated, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { NHeader } from '@/components/ui/NHeader'
import { NButton } from '@/components/ui/NButton'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import { useStore } from '@/stores'
import { callGenerateTasks, getSpaceMembers, type GeneratedTask } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { SpaceMember } from '@/types'

type MemberWithProfile = SpaceMember & { profiles?: { display_name?: string; avatar_emoji?: string } }

const FREQ_LABEL: Record<string, string> = {
  daily: 'Hằng ngày',
  weekly: 'Hằng tuần',
  '3x_week': '3 lần/tuần',
}

const ROTATE_OPTION = '__rotate__'
const ANYONE_OPTION = '__anyone__'

interface AssigneeOption {
  key: string
  label: string
  emoji: string
}

function LoadingDots({ color }: { color: string }) {
  const v = useRef([0, 1, 2].map(() => new Animated.Value(0.25))).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.stagger(
        220,
        v.map((val) =>
          Animated.sequence([
            Animated.timing(val, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(val, { toValue: 0.25, duration: 400, useNativeDriver: true }),
          ]),
        ),
      ),
    )
    loop.start()
    return () => loop.stop()
  }, [v])

  return (
    <View style={styles.dotRow}>
      {v.map((val, i) => (
        <Animated.View key={i} style={[styles.loadDot, { backgroundColor: color, opacity: val }]} />
      ))}
    </View>
  )
}

export default function AIReviewScreen() {
  const router = useRouter()
  const { spaceId, prompt } = useLocalSearchParams<{ spaceId: string; spaceName: string; prompt: string }>()
  const userId = useStore((s) => s.user?.id)
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const [phase, setPhase] = useState<'loading' | 'review' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [tasks, setTasks] = useState<GeneratedTask[]>([])
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const runGenerate = async (signal?: { cancelled: boolean }) => {
    if (!spaceId || !prompt) return
    setPhase('loading')
    setErrorMsg('')
    try {
      const memberRows = await getSpaceMembers(spaceId) as MemberWithProfile[]
      const memberInputs = memberRows.map((m) => ({
        id: m.user_id,
        display_name: m.profiles?.display_name ?? 'Bạn',
      }))
      const generated = await callGenerateTasks(prompt, memberInputs)
      if (signal?.cancelled) return
      setMembers(memberRows)
      setTasks(generated)
      setPhase('review')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err) {
      if (signal?.cancelled) return
      setErrorMsg(err instanceof Error ? err.message : 'Không thể tạo task')
      setPhase('error')
    }
  }

  useEffect(() => {
    const signal = { cancelled: false }
    runGenerate(signal)
    return () => { signal.cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId, prompt])

  const assigneeOptions: AssigneeOption[] = [
    ...members.map((m) => ({
      key: m.user_id,
      label: m.profiles?.display_name ?? 'Bạn',
      emoji: m.profiles?.avatar_emoji ?? '👤',
    })),
    { key: ROTATE_OPTION, label: 'Luân phiên', emoji: '🔁' },
    { key: ANYONE_OPTION, label: 'Ai cũng được', emoji: '✨' },
  ]

  const findOptionIndex = (assigneeName: string | null) => {
    if (!assigneeName) return assigneeOptions.length - 1
    const idx = assigneeOptions.findIndex((o) => o.label === assigneeName)
    return idx < 0 ? assigneeOptions.length - 1 : idx
  }

  const cycleAssignee = (i: number) => {
    setTasks((prev) =>
      prev.map((t, idx) => {
        if (idx !== i) return t
        const current = findOptionIndex(t.assignee_display_name)
        const next = (current + 1) % assigneeOptions.length
        const opt = assigneeOptions[next]
        return { ...t, assignee_display_name: opt.label }
      }),
    )
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const removeTask = (i: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setTasks((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleSave = async () => {
    if (!spaceId || !userId || tasks.length === 0) return
    setIsSaving(true)
    const toInsert = tasks.map((t) => {
      const assigneeMember = members.find((m) => m.profiles?.display_name === t.assignee_display_name)
      return {
        space_id: spaceId,
        name: t.name,
        icon: t.icon,
        frequency: t.frequency,
        assignee_id: assigneeMember?.user_id ?? null,
        created_by: userId,
      }
    })
    const { error } = await supabase.from('tasks').insert(toInsert)
    setIsSaving(false)
    if (error) {
      Alert.alert('Lỗi', error.message)
      return
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    router.replace('/(auth)/notif-permission')
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <NHeader step={5} total={5} />
      </View>

      {phase === 'loading' && (
        <View style={styles.loadingWrap}>
          <View style={[styles.loadCircle, { backgroundColor: c.bg, ...shadow('raised', 'lg') }]}>
            <View style={[styles.loadSpinner, { borderTopColor: c.accent, borderRightColor: c.accent }]} />
          </View>
          <Text style={[styles.loadTitle, { color: c.textDark }]}>Claude đang chia việc…</Text>
          <Text style={[styles.loadSub, { color: c.textMid }]}>Mất khoảng 3-5 giây.</Text>
          <LoadingDots color={c.accent} />
        </View>
      )}

      {phase === 'error' && (
        <View style={styles.loadingWrap}>
          <Text style={[styles.loadTitle, { color: c.textDark }]}>Có lỗi xảy ra</Text>
          <Text style={[styles.loadSub, { color: c.textMid }]}>{errorMsg}</Text>
          <View style={{ height: 16 }} />
          <NButton label="Thử lại" onPress={() => runGenerate()} />
        </View>
      )}

      {phase === 'review' && (
        <>
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            <Text style={[styles.reviewTitle, { color: c.textDark }]}>Claude đề xuất {tasks.length} task</Text>
            <Text style={[styles.reviewSub, { color: c.textMid }]}>Tap chip người làm để xoay, × để xoá task.</Text>

            {tasks.map((t, i) => {
              const opt = assigneeOptions[findOptionIndex(t.assignee_display_name)]
              return (
                <View key={i} style={[styles.taskRow, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}>
                  <View style={[styles.taskIcon, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
                    <Text style={styles.taskIconText}>{t.icon}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.taskName, { color: c.textDark }]} numberOfLines={1}>{t.name}</Text>
                    <View style={styles.metaRow}>
                      <Text style={[styles.freq, { color: c.accent }]}>{FREQ_LABEL[t.frequency] ?? t.frequency}</Text>
                      <Pressable
                        onPress={() => cycleAssignee(i)}
                        style={[styles.assigneeChip, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}
                      >
                        <Text style={styles.assigneeEmoji}>{opt.emoji}</Text>
                        <Text style={[styles.assigneeText, { color: c.textMid }]}>{opt.label}</Text>
                      </Pressable>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => removeTask(i)}
                    style={styles.removeBtn}
                    accessibilityLabel="Xoá task"
                  >
                    <Text style={[styles.removeText, { color: c.textLight }]}>×</Text>
                  </Pressable>
                </View>
              )
            })}

            {tasks.length === 0 && (
              <Text style={[styles.empty, { color: c.textLight }]}>Bạn đã xoá hết task — bấm &quot;Tạo lại&quot; để thử prompt khác.</Text>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={() => runGenerate()}
              style={[styles.ghostBtn, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}
            >
              <Text style={[styles.ghostText, { color: c.textMid }]}>✨ Tạo lại</Text>
            </Pressable>
            <View style={{ flex: 1.3 }}>
              <NButton
                label="Lưu vào Space"
                onPress={handleSave}
                isLoading={isSaving}
                isDisabled={tasks.length === 0}
                fullWidth
              />
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 16 },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  loadCircle: {
    width: 130, height: 130, borderRadius: 65,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  loadSpinner: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 4,
    borderColor: 'transparent',
    transform: [{ rotate: '45deg' }],
  },
  loadTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.6, textAlign: 'center' },
  loadSub: { fontSize: 14, textAlign: 'center' },
  dotRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  loadDot: { width: 8, height: 8, borderRadius: 4 },

  list: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 10,
  },
  reviewTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.6, marginBottom: 4 },
  reviewSub: { fontSize: 13, marginBottom: 8 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  taskIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  taskIconText: { fontSize: 22 },
  taskName: { fontSize: 15, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  freq: { fontSize: 11, fontWeight: '700' },
  assigneeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  assigneeEmoji: { fontSize: 12 },
  assigneeText: { fontSize: 11, fontWeight: '600' },
  removeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  removeText: { fontSize: 26, fontWeight: '300' },
  empty: { textAlign: 'center', fontSize: 13, marginTop: 32 },

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
    flex: 1,
    height: 60,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { fontSize: 14, fontWeight: '600' },
})
