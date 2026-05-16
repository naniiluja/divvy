import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, Alert, StyleSheet, ScrollView } from 'react-native'
import { IconShuffle } from '@/components/ui/NIcons'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { NButton } from '@/components/ui/NButton'
import { useStore } from '@/stores'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { getSpaceMembers } from '@/lib/api'
import type { SpaceMember } from '@/types'

type Frequency = 'daily' | 'weekly' | '3x_week'

const FREQ_OPTIONS: { id: Frequency | 'custom'; label: string; sub: string; disabled?: boolean }[] = [
  { id: 'daily',    label: 'Hằng ngày',   sub: 'Reset mỗi 24h' },
  { id: 'weekly',   label: 'Hằng tuần',   sub: 'Reset thứ 2 hằng tuần' },
  { id: '3x_week',  label: '3 lần/tuần',  sub: 'Thứ 2 · Thứ 4 · Thứ 6' },
  { id: 'custom',   label: 'Tuỳ chỉnh',   sub: 'Coming soon', disabled: true },
]

const TASK_EMOJIS = ['🐶','🦮','🐱','🐟','🌿','🍳','🧹','🧺','🗑️','🛒','💧','💊','📚','🚿','🍽️','☕','🌱','🧼']

export default function NewTaskScreen() {
  const router = useRouter()
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const userId = useStore((s) => s.user?.id)

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🧹')
  const [frequency, setFrequency] = useState<Frequency>('daily')
  const [assigneeId, setAssigneeId] = useState<string | null>(null)
  const [members, setMembers] = useState<SpaceMember[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  useEffect(() => {
    if (!activeSpaceId) return
    getSpaceMembers(activeSpaceId).then(setMembers)
  }, [activeSpaceId])

  const handleCreate = async () => {
    if (!name.trim() || !activeSpaceId || !userId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setIsLoading(true)
    const { error } = await supabase.from('tasks').insert({
      space_id: activeSpaceId,
      name: name.trim(),
      icon,
      frequency,
      assignee_id: assigneeId,
      created_by: userId,
    })
    setIsLoading(false)
    if (error) { Alert.alert('Lỗi', error.message); return }
    router.back()
  }

  type MemberWithProfile = SpaceMember & { profiles?: { display_name?: string; avatar_emoji?: string } }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title="Task mới" showBack />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.nameRow}>
          <View style={[styles.iconPreview, { backgroundColor: c.bg, ...shadow('raised', 'md') }]}>
            <Text style={{ fontSize: 36 }}>{icon}</Text>
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

        <Text style={[styles.sectionLabel, { color: c.textMid }]}>ICON</Text>
        <View style={styles.emojiGrid}>
          {TASK_EMOJIS.map((e) => (
            <Pressable
              key={e}
              onPress={() => setIcon(e)}
              accessibilityLabel={`Chọn icon ${e}`}
              accessibilityRole="button"
              style={[
                styles.emojiBtn,
                { backgroundColor: c.bg },
                icon === e ? shadow('inset', 'sm') : shadow('raised', 'sm'),
              ]}
            >
              <Text style={{ fontSize: 18 }}>{e}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMid }]}>TẦN SUẤT</Text>
        <View style={styles.freqList}>
          {FREQ_OPTIONS.map((f) => {
            const active = !f.disabled && frequency === f.id
            const handlePress = () => {
              if (f.disabled) {
                Alert.alert('Coming soon', 'Tần suất tuỳ chỉnh sẽ được thêm ở v1.1.')
                return
              }
              setFrequency(f.id as Frequency)
            }
            return (
              <Pressable
                key={f.id}
                onPress={handlePress}
                accessibilityLabel={`Tần suất ${f.label}`}
                accessibilityRole="button"
                style={[
                  styles.freqRow,
                  { backgroundColor: c.bg, opacity: f.disabled ? 0.55 : 1 },
                  active ? shadow('inset', 'sm') : shadow('raised', 'sm'),
                ]}
              >
                <View style={[
                  styles.radioBtn,
                  { backgroundColor: active ? c.accent : c.bg },
                  active ? shadow('accent', 'sm') : shadow('inset', 'sm'),
                ]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.freqLabel, { color: c.textDark }]}>{f.label}</Text>
                  <Text style={[styles.freqSub, { color: c.textMid }]}>{f.sub}</Text>
                </View>
              </Pressable>
            )
          })}
        </View>

        {members.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: c.textMid }]}>GIAO CHO</Text>
            <View style={styles.assigneeRow}>
              {/* "Luân phiên" is a UI-only stub for v1 — stores as assignee_id: null. */}
              <Pressable
                onPress={() => setAssigneeId(null)}
                style={[
                  styles.assigneePill,
                  { backgroundColor: c.bg },
                  shadow('raised', 'sm'),
                ]}
              >
                <View style={styles.assigneeInner}>
                  <IconShuffle size={14} color={c.textDark} />
                  <Text style={[styles.assigneeText, { color: c.textDark }]}>Luân phiên</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => setAssigneeId(null)}
                style={[
                  styles.assigneePill,
                  { backgroundColor: c.bg },
                  assigneeId === null ? shadow('accent', 'sm') : shadow('raised', 'sm'),
                ]}
              >
                <Text style={[styles.assigneeText, { color: assigneeId === null ? '#fff' : c.textDark }]}>
                  ✨ Ai cũng được
                </Text>
              </Pressable>
              {members.map((m) => {
                const profile = (m as MemberWithProfile).profiles
                const name = profile?.display_name ?? m.user_id.slice(0, 6)
                const emoji = profile?.avatar_emoji ?? '👤'
                const active = assigneeId === m.user_id
                return (
                  <Pressable
                    key={m.user_id}
                    onPress={() => setAssigneeId(m.user_id)}
                    style={[
                      styles.assigneePill,
                      { backgroundColor: c.bg },
                      active ? shadow('accent', 'sm') : shadow('raised', 'sm'),
                    ]}
                  >
                    <Text style={[styles.assigneeText, { color: active ? '#fff' : c.textDark }]}>
                      {emoji} {name}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </>
        )}

        <View style={{ height: 16 }} />

        <View style={styles.ctaRow}>
          <Pressable
            onPress={() => router.push('/(app)/task/ai-generate')}
            style={[styles.aiBtn, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}
          >
            <Text style={{ fontSize: 20, color: c.accent }}>✨</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <NButton label="Tạo Task" onPress={handleCreate} isLoading={isLoading} isDisabled={!name.trim()} fullWidth />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 22, paddingBottom: 48, gap: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconPreview: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  nameWrap: { flex: 1, borderRadius: RADIUS.input, height: 60, paddingHorizontal: 20, justifyContent: 'center' },
  nameInput: { fontSize: 17, fontWeight: '500' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.88, textTransform: 'uppercase', marginTop: 6 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  emojiBtn: { width: '10%', aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
  freqList: { gap: 8 },
  freqRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, paddingHorizontal: 14, borderRadius: 16 },
  radioBtn: { width: 18, height: 18, borderRadius: 9 },
  freqLabel: { fontSize: 13, fontWeight: '600' },
  freqSub: { fontSize: 11, marginTop: 1 },
  assigneeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  assigneePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.pill },
  assigneeInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  assigneeText: { fontSize: 13, fontWeight: '600' },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiBtn: { width: 56, height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
})
