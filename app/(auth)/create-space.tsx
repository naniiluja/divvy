import { useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NInput } from '@/components/ui/NInput'
import { NButton } from '@/components/ui/NButton'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import { useStore } from '@/stores'
import { createSpace } from '@/lib/api'

const SPACE_EMOJIS = ['🏠', '🌿', '🐶', '☀️', '🌊', '🎯', '✨', '🔥']

export default function CreateSpaceScreen() {
  const router = useRouter()
  const setActiveSpaceId = useStore((s) => s.setActiveSpaceId)
  const [spaceEmoji, setSpaceEmoji] = useState(SPACE_EMOJIS[0])
  const [spaceName, setSpaceName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const valid = spaceName.trim().length >= 2

  const handleCreate = async () => {
    if (!valid) return
    setIsLoading(true)
    try {
      const space = await createSpace(spaceName.trim(), spaceEmoji)
      setActiveSpaceId(space.id)
      router.replace('/(app)/(tabs)/' as never)
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Đã có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: c.textMid }]}>← Quay lại</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={[styles.title, { color: c.textDark }]}>Tạo Space mới</Text>
          <Text style={[styles.subtitle, { color: c.textMid }]}>
            Đặt tên và chọn emoji cho Space của bạn.
          </Text>
        </View>

        <View style={styles.identityRow}>
          <View style={[styles.emojiBtn, { backgroundColor: c.bg, ...shadow('raised', 'md') }]}>
            <Text style={styles.emojiBtnText}>{spaceEmoji}</Text>
          </View>
          <View style={styles.nameInputWrap}>
            <NInput
              value={spaceName}
              onChangeText={setSpaceName}
              placeholder="Tên Space"
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.emojiPickerRow}>
          {SPACE_EMOJIS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => setSpaceEmoji(emoji)}
              style={[
                styles.emojiOption,
                {
                  backgroundColor: c.bg,
                  ...(spaceEmoji === emoji ? shadow('inset', 'sm') : shadow('raised', 'sm')),
                },
              ]}
            >
              <Text style={styles.emojiOptionText}>{emoji}</Text>
            </Pressable>
          ))}
        </View>

        <NButton
          label="Tạo Space"
          onPress={handleCreate}
          isLoading={isLoading}
          isDisabled={!valid}
          fullWidth
        />

        <Pressable
          onPress={() => router.push('/(app)/space/join')}
          style={styles.joinBtn}
        >
          <Text style={[styles.joinText, { color: c.textMid }]}>
            Có link mời? Tham gia Space →
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 24,
  },
  backBtn: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  backText: { fontSize: 15, fontWeight: '500' },
  header: { gap: 8 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.98 },
  subtitle: { fontSize: 15, lineHeight: 22.5 },
  identityRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  emojiBtn: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBtnText: { fontSize: 30 },
  nameInputWrap: { flex: 1 },
  emojiPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOptionText: { fontSize: 22 },
  joinBtn: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  joinText: { fontSize: 14, fontWeight: '500' },
})
