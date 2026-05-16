import { useState } from 'react'
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { NHeader } from '@/components/ui/NHeader'
import { NButton } from '@/components/ui/NButton'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'

const SAMPLES = [
  { emoji: '🐶', label: 'Nhà 2 người + 1 chó nhỏ' },
  { emoji: '🏠', label: 'Phòng trọ 3 sinh viên' },
  { emoji: '👶', label: 'Căn hộ 2BR có em bé' },
]

export default function AIPromptScreen() {
  const router = useRouter()
  const { spaceId, spaceName } = useLocalSearchParams<{ spaceId: string; spaceName: string }>()
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const [prompt, setPrompt] = useState('')
  const valid = prompt.trim().length >= 5

  const handleGenerate = () => {
    if (!valid) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push({
      pathname: '/(auth)/ai-review',
      params: { spaceId, spaceName, prompt: prompt.trim() },
    })
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <NHeader step={5} total={5} onBack={() => router.replace('/(auth)/notif-permission')} />

        <View style={[styles.badge, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
          <Text style={styles.badgeEmoji}>✨</Text>
          <Text style={[styles.badgeText, { color: c.accent }]}>Powered by Claude</Text>
        </View>

        <Text style={[styles.title, { color: c.textDark }]} numberOfLines={2}>
          Việc gì lặp lại trong &quot;{spaceName ?? 'Space'}&quot;?
        </Text>
        <Text style={[styles.subtitle, { color: c.textMid }]}>
          Gõ một câu mô tả thói quen hằng ngày. Claude sẽ chia thành các task có icon, tần suất và người phụ trách.
        </Text>

        <View style={[styles.textarea, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="VD: cho chó ăn sáng tối, dắt đi dạo, đổ rác, hút bụi…"
            placeholderTextColor={c.textLight}
            multiline
            textAlignVertical="top"
            style={[styles.textareaInput, { color: c.textDark }]}
          />
        </View>

        <Text style={[styles.sampleLabel, { color: c.textMid }]}>GỢI Ý</Text>

        <View style={styles.samples}>
          {SAMPLES.map((s) => (
            <Pressable
              key={s.label}
              onPress={() => setPrompt(s.label)}
              style={[styles.sample, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}
            >
              <Text style={styles.sampleEmoji}>{s.emoji}</Text>
              <Text style={[styles.sampleText, { color: c.textDark }]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ height: 12 }} />

        <View style={styles.footer}>
          <Pressable
            onPress={() => router.replace('/(auth)/notif-permission')}
            style={[styles.ghostBtn, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}
          >
            <Text style={[styles.ghostText, { color: c.textMid }]}>Tự tạo task</Text>
          </Pressable>
          <View style={{ flex: 1.2 }}>
            <NButton label="✨ Generate" onPress={handleGenerate} isDisabled={!valid} fullWidth />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 18,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  badgeEmoji: { fontSize: 14 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.88, textTransform: 'uppercase' },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.91,
    lineHeight: 30,
  },
  subtitle: { fontSize: 15, lineHeight: 22.5, marginTop: -8 },
  textarea: {
    borderRadius: 20,
    padding: 18,
    minHeight: 140,
  },
  textareaInput: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    minHeight: 110,
  },
  sampleLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.88,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  samples: { gap: 8 },
  sample: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  sampleEmoji: { fontSize: 18 },
  sampleText: { fontSize: 13, fontWeight: '600' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ghostBtn: {
    flex: 1,
    height: 60,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { fontSize: 14, fontWeight: '600' },
})
