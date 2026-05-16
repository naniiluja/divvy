import { useState } from 'react'
import { View, Text, Pressable, TextInput, StyleSheet, Alert } from 'react-native'
import type { FC } from 'react'
import { NButton } from '@/components/ui/NButton'
import { NDivider } from '@/components/ui/NDivider'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import { useStore } from '@/stores'
import { getSpaceByInviteCode, joinSpace } from '@/lib/api'
import type { Space } from '@/types'

interface JoinSpaceBodyProps {
  onSuccess: (space: Space) => void
}

const INVITE_CODE_RE = /[a-z0-9_-]{6,12}/i
const INVITE_TOKEN_RE = /[a-f0-9]{32}/i

export const JoinSpaceBody: FC<JoinSpaceBodyProps> = ({ onSuccess }) => {
  const userId = useStore((s) => s.user?.id)
  const setActiveSpaceId = useStore((s) => s.setActiveSpaceId)

  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const extractCode = (input: string): string | null => {
    const trimmed = input.trim()
    const tokenMatch = trimmed.match(INVITE_TOKEN_RE)
    if (tokenMatch) return tokenMatch[0].toLowerCase()
    const codeMatch = trimmed.match(INVITE_CODE_RE)
    if (codeMatch) return codeMatch[0].toLowerCase()
    return null
  }

  const handleJoin = async () => {
    if (!userId) return
    const inviteCode = extractCode(code)
    if (!inviteCode) {
      Alert.alert('Mã không hợp lệ', 'Vui lòng nhập mã mời hoặc dán link mời đầy đủ.')
      return
    }
    setIsLoading(true)
    try {
      const space = await getSpaceByInviteCode(inviteCode)
      if (!space) throw new Error('Link mời không hợp lệ hoặc đã hết hạn.')
      await joinSpace(space.id, userId)
      setActiveSpaceId(space.id)
      onSuccess(space)
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Đã có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  const QRSquares = Array.from({ length: 25 }).map((_, i) => {
    const seed = (i * 7 + 13) % 11
    const filled = seed < 6
    return { filled, key: i }
  })

  return (
    <View style={styles.body}>
      <Text style={[styles.title, { color: c.textDark }]}>Tham gia Space</Text>
      <Text style={[styles.subtitle, { color: c.textMid }]}>
        Nhập mã mời hoặc quét QR từ bạn bè.
      </Text>

      <Pressable
        onPress={() => Alert.alert('Coming soon', 'QR scanner sẽ được thêm ở bản sau.')}
        style={[styles.qrTile, { backgroundColor: c.bg, ...shadow('raised', 'md') }]}
      >
        <View style={styles.qrGrid}>
          {QRSquares.map((sq) => (
            <View
              key={sq.key}
              style={[
                styles.qrCell,
                { backgroundColor: sq.filled ? c.textDark : 'transparent' },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.qrLabel, { color: c.textMid }]}>Quét QR (sắp ra)</Text>
      </Pressable>

      <NDivider label="HOẶC NHẬP MÃ" />

      <View style={[styles.codeInput, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
        <TextInput
          value={code}
          onChangeText={(t) => setCode(t.toLowerCase())}
          placeholder="abcdef"
          placeholderTextColor={c.textLight}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={32}
          style={[styles.codeInputText, { color: c.textDark }]}
          autoFocus
        />
      </View>

      <View style={{ flex: 1 }} />

      <NButton
        label="Tham gia Space"
        onPress={handleJoin}
        isLoading={isLoading}
        isDisabled={extractCode(code) === null}
        fullWidth
      />
    </View>
  )
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 18,
  },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.98 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  qrTile: {
    alignSelf: 'center',
    width: 140,
    aspectRatio: 1,
    borderRadius: 22,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  qrGrid: {
    width: 80, height: 80,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  qrCell: { width: '20%', height: '20%' },
  qrLabel: { fontSize: 10, fontWeight: '600' },
  codeInput: {
    height: 76,
    borderRadius: RADIUS.input,
    paddingHorizontal: 22,
    justifyContent: 'center',
  },
  codeInputText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
})
