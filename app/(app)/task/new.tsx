import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import Svg, { Path } from 'react-native-svg'
import { IconShuffle } from '@/components/ui/NIcons'
import { NButton } from '@/components/ui/NButton'
import { useStore } from '@/stores'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { RADIUS } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { getSpaceMembers } from '@/lib/api'
import type { SpaceMember } from '@/types'

const TASK_EMOJIS = [
  '🐶', '🦮', '🐱', '🐟', '🌿', '🍳', '🧹', '🧺', '🗑️',
  '🛒', '💧', '💊', '📚', '🚿', '🍽️', '☕', '🌱', '🧼',
]

const LUAN_PHIEN = '__luan_phien__'
const AI_CUNG_DUOC = '__anyone__'

function AISparkleButton({
  color,
  bg,
  shadow,
  onPress,
}: {
  color: string
  bg: string
  shadow: (kind: 'raised' | 'inset' | 'accent', size: 'sm' | 'md' | 'lg') => object
  onPress: () => void
}) {
  const pulse = useRef(new Animated.Value(0)).current
  const float = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start()
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start()
  }, [pulse, float])

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] })
  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -3] })

  return (
    <Pressable onPress={onPress} accessibilityLabel="Tạo task bằng AI">
      <Animated.View
        style={[
          styles.aiBtn,
          { backgroundColor: bg, ...shadow('raised', 'sm'), transform: [{ scale }, { translateY }] },
        ]}
      >
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Path
            d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7zM19 4v3M21 5.5h-3M5 17v2M6 18H4"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </Pressable>
  )
}

function AssigneePill({
  label,
  icon,
  active,
  onPress,
  bg,
  textColor,
  shadow,
}: {
  label: string
  icon: React.ReactNode
  active: boolean
  onPress: () => void
  bg: string
  textColor: string
  shadow: (kind: 'raised' | 'inset' | 'accent', size: 'sm' | 'md' | 'lg') => object
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.assigneePill,
        { backgroundColor: active ? '#6C7CFF' : bg },
        active ? shadow('accent', 'sm') : shadow('raised', 'sm'),
      ]}
    >
      <View style={styles.assigneeInner}>
        {icon}
        <Text style={[styles.assigneeText, { color: active ? '#fff' : textColor }]}>{label}</Text>
      </View>
    </Pressable>
  )
}

export default function NewTaskScreen() {
  const router = useRouter()
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const storeUserId = useStore((s) => s.user?.id)
  const showToast = useStore((s) => s.showToast)

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🧹')
  const [assignee, setAssignee] = useState<string>(LUAN_PHIEN)
  const [members, setMembers] = useState<SpaceMember[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { shadow } = useNeumorphic()
  const { c } = useTheme()

  useEffect(() => {
    if (!activeSpaceId) return
    getSpaceMembers(activeSpaceId).then(setMembers)
  }, [activeSpaceId])

  const valid = name.trim().length >= 2

  const handleCreate = async () => {
    if (!valid) {
      Alert.alert('Thiếu tên', 'Tên task cần ít nhất 2 ký tự.')
      return
    }
    if (!activeSpaceId) {
      Alert.alert('Không tìm thấy Space', 'Hãy chọn Space trước khi tạo task.')
      return
    }
    const { data: authData } = await supabase.auth.getUser()
    const actualUserId = authData.user?.id ?? storeUserId
    if (!actualUserId) {
      Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại.')
      return
    }

    const assigneeId =
      assignee === LUAN_PHIEN || assignee === AI_CUNG_DUOC ? null : assignee

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setIsLoading(true)
    const { error } = await supabase.from('tasks').insert({
      space_id: activeSpaceId,
      name: name.trim(),
      icon,
      assignee_id: assigneeId,
      created_by: actualUserId,
    })
    setIsLoading(false)
    if (error) {
      Alert.alert(
        'Không thể tạo task',
        `${error.message}${error.code ? ` (${error.code})` : ''}`,
      )
      return
    }
    showToast('✅ Đã tạo task thành công!')
    router.replace('/(app)/(tabs)/' as never)
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Huỷ"
        >
          <Text style={[styles.cancelText, { color: c.textMid }]}>Huỷ</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.textDark }]}>Task mới</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.nameRow}>
          <View style={[styles.iconPreview, { backgroundColor: c.bg, ...shadow('raised', 'md') }]}>
            <Text style={styles.iconPreviewText}>{icon}</Text>
          </View>
          <View style={[styles.nameWrap, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="VD: Cho chó ăn sáng"
              placeholderTextColor={c.textLight}
              autoFocus
              returnKeyType="done"
              style={[styles.nameInput, { color: c.textDark }]}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: c.textMid }]}>ICON</Text>
          <View style={styles.emojiGrid}>
            {TASK_EMOJIS.map((e) => {
              const active = icon === e
              return (
                <Pressable
                  key={e}
                  onPress={() => setIcon(e)}
                  style={[
                    styles.emojiBtn,
                    { backgroundColor: c.bg },
                    active ? shadow('inset', 'sm') : shadow('raised', 'sm'),
                  ]}
                >
                  <Text style={styles.emojiBtnText}>{e}</Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: c.textMid }]}>GIAO CHO</Text>
          <View style={styles.assigneeRow}>
            {members.map((m) => {
              const displayName = m.profiles?.display_name ?? m.user_id.slice(0, 6)
              const emoji = m.profiles?.avatar_emoji ?? '👤'
              return (
                <AssigneePill
                  key={m.user_id}
                  label={displayName}
                  icon={<Text style={styles.assigneeEmoji}>{emoji}</Text>}
                  active={assignee === m.user_id}
                  onPress={() => setAssignee(m.user_id)}
                  bg={c.bg}
                  textColor={c.textDark}
                  shadow={shadow}
                />
              )
            })}
            <AssigneePill
              label="Luân phiên"
              icon={
                <IconShuffle
                  size={14}
                  color={assignee === LUAN_PHIEN ? '#fff' : c.textDark}
                />
              }
              active={assignee === LUAN_PHIEN}
              onPress={() => setAssignee(LUAN_PHIEN)}
              bg={c.bg}
              textColor={c.textDark}
              shadow={shadow}
            />
            <AssigneePill
              label="Ai cũng được"
              icon={<Text style={styles.assigneeEmoji}>✨</Text>}
              active={assignee === AI_CUNG_DUOC}
              onPress={() => setAssignee(AI_CUNG_DUOC)}
              bg={c.bg}
              textColor={c.textDark}
              shadow={shadow}
            />
          </View>
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>

      <View style={styles.footer}>
        <AISparkleButton
          color={c.accent}
          bg={c.bg}
          shadow={shadow}
          onPress={() => router.push('/(app)/task/ai-generate')}
        />
        <View style={{ flex: 1 }}>
          <NButton
            label="Tạo task"
            onPress={handleCreate}
            isLoading={isLoading}
            isDisabled={!valid}
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 8,
  },
  cancelText: { fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.15 },
  scroll: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 24, gap: 18 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconPreview: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPreviewText: { fontSize: 36 },
  nameWrap: {
    flex: 1,
    borderRadius: RADIUS.input,
    height: 60,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  nameInput: { fontSize: 17, fontWeight: '500' },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.88,
    textTransform: 'uppercase',
  },
  // 9-column emoji grid: subtract gap (6 * 8 = 48) / 9 ≈ 5.3px, use percentage with margin
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBtnText: { fontSize: 22, lineHeight: 28, textAlignVertical: 'center' },
  freqList: { gap: 8 },
  freqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  radioBtn: { width: 18, height: 18, borderRadius: 9 },
  freqLabel: { fontSize: 13, fontWeight: '600' },
  freqSub: { fontSize: 11, marginTop: 1 },
  assigneeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  assigneePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  assigneeInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  assigneeEmoji: { fontSize: 14 },
  assigneeText: { fontSize: 13, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 24,
  },
  aiBtn: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
