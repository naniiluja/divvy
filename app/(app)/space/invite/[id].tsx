import { useEffect, useState } from 'react'
import { View, Text, Pressable, Share, StyleSheet, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Clipboard from 'expo-clipboard'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import { NButton } from '@/components/ui/NButton'
import { NHeader } from '@/components/ui/NHeader'
import { useStore } from '@/stores'
import { getOrCreateInviteLink } from '@/lib/api'
import type { InviteLink } from '@/types'

const APP_SCHEME = 'divvy'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function InviteScreen() {
  const { id: spaceId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const user = useStore((s) => s.user)
  const [invite, setInvite] = useState<InviteLink | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  useEffect(() => {
    if (!spaceId || !user?.id || !UUID_RE.test(spaceId)) {
      setIsLoading(false)
      return
    }
    getOrCreateInviteLink(spaceId, user.id)
      .then(setInvite)
      .catch((err: Error) => Alert.alert('Lỗi', err.message))
      .finally(() => setIsLoading(false))
  }, [spaceId, user?.id])

  const inviteUrl = invite ? `${APP_SCHEME}://join/${invite.token}` : ''
  const shortCode = invite?.token?.slice(0, 8) ?? ''

  const handleCopy = async () => {
    if (!inviteUrl) return
    await Clipboard.setStringAsync(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (!inviteUrl) return
    await Share.share({ message: `Tham gia Space của mình trên Divvy: ${inviteUrl}` })
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.content}>
        <NHeader step={0} total={0} onBack={() => router.back()} />

        <View style={styles.header}>
          <Text style={[styles.title, { color: c.textDark }]}>Mời thành viên</Text>
          <Text style={[styles.subtitle, { color: c.textMid }]}>
            Chia sẻ link hoặc mã mời cho bạn bè.
          </Text>
        </View>

        {isLoading ? (
          <View style={[styles.linkCard, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
            <Text style={[styles.linkLabel, { color: c.textLight }]}>Đang tạo link…</Text>
          </View>
        ) : (
          <View style={[styles.linkCard, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
            <Text style={[styles.linkLabel, { color: c.textLight }]}>MÃ MỜI</Text>
            <Text style={[styles.codeText, { color: c.accent }]}>{shortCode}</Text>
            <Text style={[styles.linkUrl, { color: c.textMid }]} numberOfLines={1}>
              {inviteUrl}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            onPress={handleCopy}
            style={[styles.actionBtn, { backgroundColor: c.bg, ...shadow('raised', 'md') }]}
          >
            <Text style={styles.actionEmoji}>{copied ? '✅' : '🔗'}</Text>
            <Text style={[styles.actionLabel, { color: c.textDark }]}>
              {copied ? 'Đã copy!' : 'Sao chép link'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleShare}
            style={[styles.actionBtn, { backgroundColor: c.bg, ...shadow('raised', 'md') }]}
          >
            <Text style={styles.actionEmoji}>📤</Text>
            <Text style={[styles.actionLabel, { color: c.textDark }]}>Chia sẻ</Text>
          </Pressable>
        </View>

        <View style={styles.expireNote}>
          <Text style={[styles.expireText, { color: c.textLight }]}>
            Link có hiệu lực trong 7 ngày.
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <NButton label="Xong" onPress={() => router.back()} fullWidth />
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
  linkCard: {
    borderRadius: RADIUS.card,
    padding: 24,
    gap: 8,
    alignItems: 'center',
  },
  linkLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.88,
    textTransform: 'uppercase',
  },
  codeText: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 4,
  },
  linkUrl: {
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    flex: 1,
    borderRadius: RADIUS.card,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    minHeight: 100,
    justifyContent: 'center',
  },
  actionEmoji: { fontSize: 28 },
  actionLabel: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  expireNote: { alignItems: 'center' },
  expireText: { fontSize: 12 },
})
