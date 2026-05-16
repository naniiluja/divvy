import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { FC } from 'react'
import * as Haptics from 'expo-haptics'
import { NSheet } from '@/components/ui/NSheet'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import type { Task } from '@/types'

const FREQ_LABEL: Record<string, string> = {
  daily: 'Hằng ngày',
  weekly: 'Hằng tuần',
  '3x_week': '3 lần/tuần',
  '2x_week': '2 lần/tuần',
}

interface SkipCoverSheetProps {
  visible: boolean
  task: Task | null
  onClose: () => void
  onSkip: (taskId: string) => void
}

export const SkipCoverSheet: FC<SkipCoverSheetProps> = ({ visible, task, onClose, onSkip }) => {
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  if (!task) {
    return <NSheet visible={visible} onClose={onClose}><View /></NSheet>
  }

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSkip(task.id)
  }

  return (
    <NSheet visible={visible} onClose={onClose}>
      <View style={[styles.summary, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
        <View style={[styles.iconBox, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
          <Text style={styles.icon}>{task.icon}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.name, { color: c.textDark }]} numberOfLines={1}>{task.name}</Text>
          <Text style={[styles.sub, { color: c.textMid }]}>{FREQ_LABEL[task.frequency] ?? task.frequency}</Text>
        </View>
      </View>

      <Text style={[styles.section, { color: c.textMid }]}>BẠN MUỐN…</Text>

      <Pressable
        onPress={handleSkip}
        style={[styles.option, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}
      >
        <View style={[styles.optIcon, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
          <Text style={styles.optEmoji}>⏭️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.optLabel, { color: c.textDark }]}>Bỏ qua lần này</Text>
          <Text style={[styles.optSub, { color: c.textMid }]}>Task vẫn ở &quot;CẦN LÀM&quot;</Text>
        </View>
      </Pressable>

      <Pressable
        disabled
        style={[styles.option, { backgroundColor: c.bg, ...shadow('raised', 'sm'), opacity: 0.55, marginTop: 10 }]}
      >
        <View style={[styles.optIcon, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
          <Text style={styles.optEmoji}>🤝</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.optLabel, { color: c.textDark }]}>Nhờ ai đó cover</Text>
          <Text style={[styles.optSub, { color: c.textMid }]}>Thông báo cho thành viên khác</Text>
        </View>
        <View style={[styles.vBadge, { backgroundColor: c.accent }]}>
          <Text style={styles.vBadgeText}>v1.1</Text>
        </View>
      </Pressable>

      <Pressable onPress={onClose} style={styles.cancel}>
        <Text style={[styles.cancelText, { color: c.textMid }]}>Huỷ</Text>
      </Pressable>
    </NSheet>
  )
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  iconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
  name: { fontSize: 15, fontWeight: '600', letterSpacing: -0.15 },
  sub: { fontSize: 12, marginTop: 1 },
  section: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase',
    marginTop: 20, marginBottom: 10, paddingHorizontal: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  optIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  optEmoji: { fontSize: 20 },
  optLabel: { fontSize: 14, fontWeight: '700' },
  optSub: { fontSize: 11, marginTop: 2 },
  vBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill },
  vBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  cancel: { alignItems: 'center', paddingVertical: 14, marginTop: 10 },
  cancelText: { fontSize: 14, fontWeight: '600' },
})
