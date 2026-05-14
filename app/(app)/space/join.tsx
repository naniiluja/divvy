import { useState } from 'react'
import { View, Text, Alert, StyleSheet, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NButton } from '@/components/ui/NButton'
import { NHeader } from '@/components/ui/NHeader'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import { useStore } from '@/stores'
import { getSpaceByInviteCode, joinSpace } from '@/lib/api'

export default function JoinSpaceScreen() {
  const router = useRouter()
  const user = useStore((s) => s.user)
  const setActiveSpaceId = useStore((s) => s.setActiveSpaceId)
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const INVITE_CODE_RE = /[a-z0-9_-]{6,12}/i
  const INVITE_TOKEN_RE = /[a-f0-9]{32}/i

  const extractCode = (input: string): string | null => {
    const trimmed = input.trim()
    const tokenMatch = trimmed.match(INVITE_TOKEN_RE)
    if (tokenMatch) return tokenMatch[0].toLowerCase()
    const codeMatch = trimmed.match(INVITE_CODE_RE)
    if (codeMatch) return codeMatch[0].toLowerCase()
    return null
  }

  const handleJoin = async () => {
    if (!user?.id) return
    const inviteCode = extractCode(code)
    if (!inviteCode) {
      Alert.alert('Mã không hợp lệ', 'Vui lòng nhập mã mời hoặc dán link mời đầy đủ.')
      return
    }

    setIsLoading(true)
    try {
      const space = await getSpaceByInviteCode(inviteCode)
      if (!space) throw new Error('Link mời không hợp lệ hoặc đã hết hạn.')

      await joinSpace(space.id, user.id)
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
      <View style={styles.content}>
        <NHeader step={0} total={0} onBack={() => router.back()} />

        <View style={styles.header}>
          <Text style={[styles.title, { color: c.textDark }]}>Tham gia Space</Text>
          <Text style={[styles.subtitle, { color: c.textMid }]}>
            Nhập mã mời 8 ký tự hoặc dán link mời từ bạn bè.
          </Text>
        </View>

        <View style={[styles.input, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="abc12345 hoặc link mời"
            placeholderTextColor={c.textLight}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.inputText, { color: c.textDark }]}
            autoFocus
          />
        </View>

        <View style={{ flex: 1 }} />

        <NButton
          label="Tham gia"
          onPress={handleJoin}
          isLoading={isLoading}
          isDisabled={extractCode(code) === null}
          fullWidth
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 52,
    paddingBottom: 32,
    gap: 24,
  },
  header: { gap: 8 },
  title: { fontSize: 30, fontWeight: '700', letterSpacing: -1.05, lineHeight: 33 },
  subtitle: { fontSize: 15, lineHeight: 22.5 },
  input: {
    height: 60,
    borderRadius: RADIUS.input,
    paddingHorizontal: 22,
    justifyContent: 'center',
  },
  inputText: { fontSize: 17, fontWeight: '500' },
})
