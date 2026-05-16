import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import Svg, { Path } from 'react-native-svg'
import { NButton } from '@/components/ui/NButton'
import { useStore } from '@/stores'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS, type ThemeColors } from '@/constants/theme'
import { getSpaceMembers, callGenerateTasks, getProfile, type GeneratedTask } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { SpaceMember } from '@/types'

type MemberWithProfile = SpaceMember & { profiles?: { display_name?: string; avatar_emoji?: string } }
type Phase = 'prompt' | 'loading' | 'review' | 'error'

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

type ShadowFn = (kind: 'raised' | 'inset' | 'accent', size: 'sm' | 'md' | 'lg') => object

function AISpinner({ c, shadow }: { c: ThemeColors; shadow: ShadowFn }) {
  const spin = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true }),
    ).start()
  }, [spin])

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

  return (
    <View style={[styles.spinnerOuter, { backgroundColor: c.bg, ...shadow('inset', 'md') }]}>
      <Animated.View
        style={[
          styles.spinnerRing,
          {
            borderTopColor: c.accent,
            borderRightColor: c.accent2,
            transform: [{ rotate }],
          },
        ]}
      />
      <View style={[styles.spinnerCore, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}>
        <Svg width={28} height={28} viewBox="0 0 24 24">
          <Path
            d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7zM19 4v3M21 5.5h-3M5 17v2M6 18H4"
            stroke={c.accent}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>
    </View>
  )
}

function StepRow({
  label,
  index,
  c,
  shadow,
}: {
  label: string
  index: number
  c: ThemeColors
  shadow: ShadowFn
}) {
  const fill = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(index * 600),
        Animated.timing(fill, { toValue: 1, duration: 600, useNativeDriver: false }),
        Animated.timing(fill, { toValue: 0, duration: 0, useNativeDriver: false }),
        Animated.delay(1800 - (index + 1) * 600),
      ]),
    ).start()
  }, [fill, index])

  const dotBg = fill.interpolate({ inputRange: [0, 1], outputRange: [c.bg, c.accent] })
  const insetSm = shadow('inset', 'sm')

  return (
    <View style={[styles.stepRow, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}>
      <Animated.View style={[styles.stepDot, insetSm, { backgroundColor: dotBg }]} />
      <Text style={[styles.stepText, { color: c.textMid }]}>{label}</Text>
    </View>
  )
}

const SAMPLES = [
  '🐶 Cho chó ăn sáng tối, dắt đi dạo',
  '🧹 Quét nhà, lau bếp, đổ rác',
  '🍳 Nấu ăn 7 ngày, đi chợ cuối tuần',
]

export default function AIGenerateScreen() {
  const router = useRouter()
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const storeUserId = useStore((s) => s.user?.id)

  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const [phase, setPhase] = useState<Phase>('prompt')
  const [prompt, setPrompt] = useState('')
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [tasks, setTasks] = useState<GeneratedTask[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error && data.user) setAuthUserId(data.user.id)
    })
  }, [])

  const userId = authUserId ?? storeUserId

  const runGenerate = async () => {
    if (!activeSpaceId || !prompt.trim()) return
    setPhase('loading')
    setErrorMsg('')
    try {
      const memberRows = (await getSpaceMembers(activeSpaceId)) as MemberWithProfile[]
      let memberInputs = memberRows.map((m) => ({
        id: m.user_id,
        display_name: m.profiles?.display_name ?? 'Bạn',
      }))
      if (memberInputs.length === 0) {
        const { data: authData } = await supabase.auth.getUser()
        if (authData.user) {
          const profile = await getProfile(authData.user.id)
          memberInputs = [{ id: authData.user.id, display_name: profile?.display_name ?? 'Bạn' }]
        }
      }
      const generated = await callGenerateTasks(prompt.trim(), memberInputs)
      setMembers(memberRows)
      setTasks(generated)
      setPhase('review')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err) {
      console.error('[task/ai-generate] failed:', err)
      setErrorMsg(err instanceof Error ? err.message : 'Không thể tạo task')
      setPhase('error')
    }
  }

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
        return { ...t, assignee_display_name: assigneeOptions[next].label }
      }),
    )
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const removeTask = (i: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setTasks((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleSave = async () => {
    if (!activeSpaceId) {
      Alert.alert('Thiếu Space', 'Hãy chọn Space trước.')
      return
    }
    if (!userId) {
      Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại.')
      return
    }
    if (tasks.length === 0) {
      Alert.alert('Chưa có task nào', 'Tạo lại với mô tả khác nhé.')
      return
    }
    setIsSaving(true)
    const toInsert = tasks.map((t) => {
      const assigneeMember = members.find((m) => m.profiles?.display_name === t.assignee_display_name)
      return {
        space_id: activeSpaceId,
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
      Alert.alert('Không thể lưu task', `${error.message}${error.code ? ` (${error.code})` : ''}`)
      return
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    router.dismissTo('/(app)/(tabs)')
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={[styles.cancelText, { color: c.textMid }]}>← Huỷ</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.textDark }]}>✨ Claude chia việc</Text>
        <View style={{ width: 50 }} />
      </View>

      {phase === 'prompt' && (
        <ScrollView contentContainerStyle={styles.promptScroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.badge, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}>
            <Text style={[styles.badgeText, { color: c.accent }]}>✨ Powered by Claude</Text>
          </View>
          <Text style={[styles.title, { color: c.textDark }]}>Việc gì lặp lại trong Space?</Text>
          <Text style={[styles.subtitle, { color: c.textMid }]}>
            Mô tả tự nhiên — Claude sẽ chia thành task và phân công đều cho members.
          </Text>

          <View style={[styles.textareaWrap, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder="VD: cho chó ăn sáng tối, dắt đi dạo, tắm cho chó cuối tuần..."
              placeholderTextColor={c.textLight}
              multiline
              style={[styles.textarea, { color: c.textDark }]}
            />
          </View>

          <Text style={[styles.sampleLabel, { color: c.textLight }]}>GỢI Ý</Text>
          <View style={styles.sampleList}>
            {SAMPLES.map((s) => (
              <Pressable
                key={s}
                onPress={() => setPrompt(s.replace(/^[^\s]+\s/, ''))}
                style={[styles.sampleChip, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}
              >
                <Text style={[styles.sampleText, { color: c.textMid }]}>{s}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ height: 24 }} />
          <NButton
            label="✨ Generate"
            onPress={runGenerate}
            isDisabled={!prompt.trim()}
            fullWidth
          />
        </ScrollView>
      )}

      {phase === 'loading' && (
        <View style={styles.loadingWrap}>
          <AISpinner c={c} shadow={shadow} />
          <View style={styles.loadTextBlock}>
            <Text style={[styles.loadTitle, { color: c.textDark }]}>Claude đang chia việc…</Text>
            <Text style={[styles.loadSub, { color: c.textMid }]}>
              Đang phân tích thói quen và chia đều cho {Math.max(members.length, 1)} người
            </Text>
          </View>
          <View style={styles.stepList}>
            {['Đọc mô tả của bạn', 'Tạo cấu trúc task', 'Phân chia cho members'].map((s, i) => (
              <StepRow key={s} label={s} index={i} c={c} shadow={shadow} />
            ))}
          </View>
        </View>
      )}

      {phase === 'error' && (
        <View style={styles.loadingWrap}>
          <Text style={[styles.loadTitle, { color: c.textDark }]}>Có lỗi xảy ra</Text>
          <Text style={[styles.loadSub, { color: c.textMid }]} numberOfLines={6}>{errorMsg}</Text>
          <View style={{ height: 16 }} />
          <NButton label="Thử lại" onPress={() => setPhase('prompt')} />
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
                  <Pressable onPress={() => removeTask(i)} style={styles.removeBtn} accessibilityLabel="Xoá task">
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
              onPress={() => setPhase('prompt')}
              style={[styles.ghostBtn, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}
            >
              <Text style={[styles.ghostText, { color: c.textMid }]}>✨ Tạo lại</Text>
            </Pressable>
            <View style={{ flex: 1.3 }}>
              <NButton
                label={`Lưu ${tasks.length} task`}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  cancelText: { fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.4 },

  promptScroll: { padding: 24, paddingBottom: 60, gap: 14 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.6, marginTop: 4 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  textareaWrap: { borderRadius: RADIUS.card, padding: 16, minHeight: 130, marginTop: 8 },
  textarea: { fontSize: 15, fontWeight: '500', lineHeight: 22, textAlignVertical: 'top', minHeight: 100 },
  sampleLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 12 },
  sampleList: { gap: 8 },
  sampleChip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
  },
  sampleText: { fontSize: 13, fontWeight: '600' },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 32,
    gap: 28,
  },
  spinnerOuter: {
    width: 130, height: 130, borderRadius: 65,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  spinnerRing: {
    position: 'absolute', top: 14, left: 14, right: 14, bottom: 14,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  spinnerCore: {
    width: 70, height: 70, borderRadius: 35,
    alignItems: 'center', justifyContent: 'center',
  },
  loadTextBlock: { alignItems: 'center', gap: 6 },
  loadTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.6, textAlign: 'center' },
  loadSub: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  stepList: { width: '100%', gap: 8 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  stepDot: { width: 18, height: 18, borderRadius: 9 },
  stepText: { fontSize: 13 },

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
