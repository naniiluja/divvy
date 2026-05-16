import { useState } from 'react'
import { View, Text, Pressable, Alert, ScrollView, TextInput, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { NButton } from '@/components/ui/NButton'
import { NHeader } from '@/components/ui/NHeader'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { upsertProfile } from '@/lib/api'

const EMOJIS = ['🌸', '🌿', '🐶', '🐱', '🍑', '☕', '🌙', '⭐', '🦊', '🐻', '🌊', '🍀']

export default function ProfileSetupScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🌸')
  const [isLoading, setIsLoading] = useState(false)
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const valid = name.trim().length >= 2

  const handleStart = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Không tìm thấy user')
      await upsertProfile({ id: user.id, display_name: name.trim(), avatar_emoji: emoji })
      router.replace('/(auth)/space-type')
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Đã có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <NHeader step={3} total={5} onBack={() => router.replace('/(auth)/welcome')} />

        <View style={styles.headingBlock}>
          <Text style={[styles.title, { color: c.textDark }]}>Bạn tên là gì?</Text>
          <Text style={[styles.subtitle, { color: c.textMid }]}>
            Tên này sẽ hiển thị cho các thành viên trong Space của bạn.
          </Text>
        </View>

        {/* Avatar large */}
        <View style={styles.avatarWrap}>
          <View style={[styles.avatarCircle, { backgroundColor: c.bg, ...shadow('raised', 'md') }]}>
            <Text style={styles.avatarEmoji}>{emoji}</Text>
          </View>
          <View style={[styles.editBadge, { backgroundColor: c.accent, ...shadow('accent', 'sm') }]}>
            <Text style={styles.editBadgeText}>✏️</Text>
          </View>
        </View>

        {/* Name input */}
        <View style={[styles.nameInput, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="VD: Linh, Anh, Em…"
            placeholderTextColor={c.textLight}
            style={[styles.nameInputText, { color: c.textDark }]}
            autoFocus
          />
        </View>

        {/* Emoji picker */}
        <View style={{ gap: 12 }}>
          <Text style={[styles.pickerLabel, { color: c.textMid }]}>CHỌN AVATAR</Text>
          <View style={styles.emojiGrid}>
            {EMOJIS.map(e => {
              const active = emoji === e
              return (
                <Pressable
                  key={e}
                  onPress={() => setEmoji(e)}
                  style={[
                    styles.emojiCell,
                    {
                      backgroundColor: c.bg,
                      transform: [{ scale: active ? 0.95 : 1 }],
                      ...(active ? shadow('inset', 'sm') : shadow('raised', 'sm')),
                    },
                  ]}
                >
                  <Text style={styles.emojiCellText}>{e}</Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={{ height: 32 }} />

        <NButton label="Tiếp theo" onPress={handleStart} isLoading={isLoading} isDisabled={!valid} fullWidth />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 28,
    paddingTop: 52,
    paddingBottom: 32,
    gap: 22,
  },
  headingBlock: { gap: 8 },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1.05,
    lineHeight: 33,
  },
  subtitle: { fontSize: 15, lineHeight: 22.5 },
  avatarWrap: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 112,
    height: 112,
    borderRadius: RADIUS.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 56 },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 36,
    height: 36,
    borderRadius: RADIUS.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadgeText: { fontSize: 16 },
  nameInput: {
    height: 60,
    borderRadius: RADIUS.input,
    paddingHorizontal: 22,
    justifyContent: 'center',
  },
  nameInputText: {
    fontSize: 17,
    fontWeight: '500',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.96,
    textTransform: 'uppercase',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emojiCell: {
    width: '14%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCellText: { fontSize: 22 },
})
