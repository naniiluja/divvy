import { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import type { User } from '@supabase/supabase-js'
import { NInput } from '@/components/ui/NInput'
import { NButton } from '@/components/ui/NButton'
import { NHeader } from '@/components/ui/NHeader'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { RADIUS } from '@/constants/theme'
import { useStore } from '@/stores'
import { supabase } from '@/lib/supabase'
import { createSpace, getOrCreateInviteLink, getProfile } from '@/lib/api'

const SPACE_EMOJIS = ['🏠', '🌿', '🐶', '☀️', '🌊', '🎯', '✨', '🔥']
const MEMBER_EMOJIS = ['👤', '👩', '👨', '🧑', '👧', '👦', '🐶', '🐱']

interface PlaceholderMember {
  id: string
  emoji: string
  name: string
}

export default function CreateSpaceScreen() {
  const router = useRouter()
  const setActiveSpaceId = useStore((s) => s.setActiveSpaceId)

  const [authUser, setAuthUser] = useState<User | null>(null)
  const [profileName, setProfileName] = useState<string | null>(null)
  const [profileEmoji, setProfileEmoji] = useState<string | null>(null)
  const [spaceEmoji, setSpaceEmoji] = useState(SPACE_EMOJIS[0])
  const [spaceName, setSpaceName] = useState('')
  const [extraMembers, setExtraMembers] = useState<PlaceholderMember[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { shadow } = useNeumorphic()
  const { c } = useTheme()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error || !data.user) return
      setAuthUser(data.user)
      const profile = await getProfile(data.user.id)
      if (profile) {
        setProfileName(profile.display_name)
        setProfileEmoji(profile.avatar_emoji ?? null)
      }
    })
  }, [])

  const user = authUser
  const valid = spaceName.trim().length >= 2

  const displayName = profileName
    ?? (user?.user_metadata?.display_name as string | undefined)
    ?? 'Bạn'
  const avatarEmoji = profileEmoji
    ?? (user?.user_metadata?.avatar_emoji as string | undefined)
    ?? '🌸'

  const addMember = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setExtraMembers((prev) => [
      ...prev,
      { id: `m-${Date.now()}-${prev.length}`, emoji: MEMBER_EMOJIS[(prev.length + 1) % MEMBER_EMOJIS.length], name: '' },
    ])
  }

  const removeMember = (id: string) =>
    setExtraMembers((prev) => prev.filter((m) => m.id !== id))

  const updateMemberName = (id: string, name: string) =>
    setExtraMembers((prev) => prev.map((m) => (m.id === id ? { ...m, name } : m)))

  const cycleMemberEmoji = (id: string) =>
    setExtraMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m
        const i = (MEMBER_EMOJIS.indexOf(m.emoji) + 1) % MEMBER_EMOJIS.length
        return { ...m, emoji: MEMBER_EMOJIS[i] }
      }),
    )

  const handleCopyLink = async () => {
    if (!user?.id) return
    try {
      const space = await createSpace(spaceName.trim() || 'Space mới', spaceEmoji)
      const invite = await getOrCreateInviteLink(space.id, user.id)
      await Clipboard.setStringAsync(`divvy://join/${invite.token}`)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert('Đã copy', 'Link mời đã được copy vào clipboard.')
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể tạo link mời')
    }
  }

  const handleCreate = async () => {
    if (!valid) {
      Alert.alert('Thiếu thông tin', 'Tên Space phải có ít nhất 2 ký tự.')
      return
    }
    if (!user?.id) {
      Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại.')
      router.replace('/(auth)/welcome')
      return
    }
    setIsLoading(true)
    try {
      const space = await createSpace(spaceName.trim(), spaceEmoji)
      setActiveSpaceId(space.id)
      router.replace({
        pathname: '/(auth)/ai-prompt',
        params: { spaceId: space.id, spaceName: space.name },
      })
    } catch (err) {
      const message = err instanceof Error
        ? `${err.message}${'code' in err && err.code ? ` (${err.code})` : ''}`
        : JSON.stringify(err)
      Alert.alert('Không thể tạo Space', message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <NHeader step={4} total={5} onBack={() => router.replace('/(auth)/space-type')} />

        <View style={styles.header}>
          <Text style={[styles.title, { color: c.textDark }]}>Đặt tên Space</Text>
          <Text style={[styles.subtitle, { color: c.textMid }]}>
            Chọn tên, emoji và mời thành viên trong Space của bạn.
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
                { backgroundColor: c.bg },
                spaceEmoji === emoji ? shadow('inset', 'sm') : shadow('raised', 'sm'),
              ]}
            >
              <Text style={styles.emojiOptionText}>{emoji}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMid }]}>THÀNH VIÊN</Text>

        <View style={styles.memberList}>
          <View style={[styles.memberRow, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}>
            <View style={[styles.memberEmoji, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
              <Text style={styles.memberEmojiText}>{avatarEmoji}</Text>
            </View>
            <Text style={[styles.memberName, { color: c.textDark }]}>{displayName}</Text>
            <View style={[styles.youBadge, { backgroundColor: c.accent }]}>
              <Text style={styles.youBadgeText}>Bạn</Text>
            </View>
          </View>

          {extraMembers.map((m) => (
            <View key={m.id} style={[styles.memberRow, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}>
              <Pressable
                onPress={() => cycleMemberEmoji(m.id)}
                style={[styles.memberEmoji, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}
              >
                <Text style={styles.memberEmojiText}>{m.emoji}</Text>
              </Pressable>
              <TextInput
                value={m.name}
                onChangeText={(t) => updateMemberName(m.id, t)}
                placeholder="Tên thành viên"
                placeholderTextColor={c.textLight}
                style={[styles.memberInput, { color: c.textDark }]}
              />
              <Pressable
                onPress={() => removeMember(m.id)}
                style={styles.memberRemove}
                accessibilityLabel="Xoá thành viên"
              >
                <Text style={[styles.memberRemoveText, { color: c.textLight }]}>×</Text>
              </Pressable>
            </View>
          ))}

          <Pressable
            onPress={addMember}
            style={[styles.addMemberBtn, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}
          >
            <Text style={[styles.addMemberText, { color: c.textMid }]}>+ Thêm thành viên</Text>
          </Pressable>
        </View>

        <View style={styles.inviteRow}>
          <Pressable
            onPress={handleCopyLink}
            style={[styles.inviteChip, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}
          >
            <Text style={styles.inviteChipEmoji}>🔗</Text>
            <Text style={[styles.inviteChipLabel, { color: c.textDark }]}>Sao chép link</Text>
          </Pressable>
          <Pressable
            onPress={() => Alert.alert('QR code', 'Tạo Space trước rồi mở từ tab Members để xem QR.')}
            style={[styles.inviteChip, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}
          >
            <Text style={styles.inviteChipEmoji}>📷</Text>
            <Text style={[styles.inviteChipLabel, { color: c.textDark }]}>QR code</Text>
          </Pressable>
        </View>

        <View style={{ height: 8 }} />

        <NButton
          label="Tiếp theo"
          onPress={handleCreate}
          isLoading={isLoading}
          isDisabled={!valid}
          fullWidth
        />
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
  header: { gap: 8 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.98 },
  subtitle: { fontSize: 15, lineHeight: 22.5 },
  identityRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  emojiBtn: {
    width: 64, height: 64, borderRadius: RADIUS.card,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiBtnText: { fontSize: 30 },
  nameInputWrap: { flex: 1 },
  emojiPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emojiOption: {
    width: 44, height: 44, borderRadius: RADIUS.chip,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiOptionText: { fontSize: 22 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.88,
    textTransform: 'uppercase', marginTop: 8, paddingHorizontal: 4,
  },
  memberList: { gap: 10 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
  },
  memberEmoji: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  memberEmojiText: { fontSize: 20 },
  memberName: { flex: 1, fontSize: 15, fontWeight: '600' },
  memberInput: { flex: 1, fontSize: 15, fontWeight: '600' },
  memberRemove: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  memberRemoveText: { fontSize: 24, fontWeight: '300' },
  youBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  youBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  addMemberBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: RADIUS.pill,
  },
  addMemberText: { fontSize: 13, fontWeight: '600' },
  inviteRow: { flexDirection: 'row', gap: 10 },
  inviteChip: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteChipEmoji: { fontSize: 16 },
  inviteChipLabel: { fontSize: 13, fontWeight: '600' },
})
