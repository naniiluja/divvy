import { useState } from 'react'
import { View, Text, TextInput, Pressable, Alert, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { NButton } from '@/components/ui/NButton'
import { useStore } from '@/stores'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import { supabase } from '@/lib/supabase'

type Frequency = 'daily' | 'weekly' | '3x_week'

const FREQ_LABELS: Record<Frequency, string> = {
  daily: 'Hằng ngày',
  weekly: 'Hằng tuần',
  '3x_week': '3 lần/tuần',
}

const QUICK_EMOJIS = ['🧹', '🗑️', '🍳', '🧺', '🧽', '🪴', '🐾', '🛒', '💊', '📦']

export default function NewTaskScreen() {
  const router = useRouter()
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const userId = useStore((s) => s.user?.id)

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📋')
  const [frequency, setFrequency] = useState<Frequency>('daily')
  const [isLoading, setIsLoading] = useState(false)

  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const handleCreate = async () => {
    if (!name.trim() || !activeSpaceId || !userId) return
    setIsLoading(true)
    const { error } = await supabase
      .from('tasks')
      .insert({
        space_id: activeSpaceId,
        name: name.trim(),
        icon,
        frequency,
        created_by: userId,
      })
    setIsLoading(false)
    if (error) {
      Alert.alert('Lỗi', error.message)
      return
    }
    router.back()
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title="Tạo Task mới" showBack />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.section, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tên công việc"
            placeholderTextColor={c.textLight}
            autoFocus
            returnKeyType="done"
            style={[styles.nameInput, { color: c.textDark }]}
          />
        </View>

        <Text style={[styles.label, { color: c.textMid }]}>ICON</Text>
        <View style={styles.emojiRow}>
          {QUICK_EMOJIS.map((e) => (
            <Pressable
              key={e}
              onPress={() => setIcon(e)}
              accessibilityLabel={`Chọn icon ${e}`}
              accessibilityRole="button"
              style={[
                styles.emojiBtn,
                { backgroundColor: c.bg },
                icon === e ? shadow('accent', 'sm') : shadow('raised', 'sm'),
              ]}
            >
              <Text style={{ fontSize: 24 }}>{e}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: c.textMid }]}>TẦN SUẤT</Text>
        <View style={styles.freqRow}>
          {(Object.keys(FREQ_LABELS) as Frequency[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFrequency(f)}
              accessibilityLabel={`Tần suất ${FREQ_LABELS[f]}`}
              accessibilityRole="button"
              style={[
                styles.freqBtn,
                { backgroundColor: c.bg },
                frequency === f ? shadow('accent', 'sm') : shadow('raised', 'sm'),
              ]}
            >
              <Text style={[
                styles.freqLabel,
                { color: frequency === f ? c.accent : c.textMid },
              ]}>
                {FREQ_LABELS[f]}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.spacer} />

        <NButton
          label="Tạo Task"
          onPress={handleCreate}
          isLoading={isLoading}
          isDisabled={!name.trim()}
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  section: { borderRadius: RADIUS.input, paddingHorizontal: 20, height: 60, justifyContent: 'center' },
  nameInput: { fontSize: 17, fontWeight: '500' },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.88, textTransform: 'uppercase', marginTop: 8 },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emojiBtn: { width: 52, height: 52, borderRadius: RADIUS.chip, alignItems: 'center', justifyContent: 'center' },
  freqRow: { flexDirection: 'row', gap: 10 },
  freqBtn: { flex: 1, height: 48, borderRadius: RADIUS.card, alignItems: 'center', justifyContent: 'center' },
  freqLabel: { fontSize: 13, fontWeight: '600' },
  spacer: { height: 16 },
})
