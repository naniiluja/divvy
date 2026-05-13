import { useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NInput } from '@/components/ui/NInput'
import { NButton } from '@/components/ui/NButton'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'

const SPACE_EMOJIS = ['🏠', '🌿', '🐶', '☀️', '🌊', '🎯', '✨', '🔥']

interface Member {
  id: string
  name: string
}

export default function CreateSpaceScreen() {
  const router = useRouter()
  const [spaceEmoji, setSpaceEmoji] = useState(SPACE_EMOJIS[0])
  const [spaceName, setSpaceName] = useState('')
  const [members, setMembers] = useState<Member[]>([{ id: '1', name: '' }])
  const [isLoading, setIsLoading] = useState(false)

  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const emojiBtnShadow = shadow('raised', 'md')
  const inviteChipShadow = shadow('raised', 'sm')
  const memberAvatarShadow = shadow('inset', 'sm')

  const handleAddMember = () => {
    setMembers((prev) => [...prev, { id: Date.now().toString(), name: '' }])
  }

  const handleMemberChange = (id: string, name: string) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, name } : m)))
  }

  const handleCreate = async () => {
    if (!spaceName.trim()) return
    setIsLoading(true)
    // TODO: create space in Supabase
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace('/(app)/(tabs)/' as any)
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
        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: c.textMid }]}>← Quay lại</Text>
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.textDark }]}>Tạo Space mới</Text>
          <Text style={[styles.subtitle, { color: c.textMid }]}>
            Đặt tên và mời thành viên vào Space của bạn.
          </Text>
        </View>

        {/* Space identity */}
        <View style={styles.identityRow}>
          <Pressable
            style={[
              styles.emojiBtn,
              {
                backgroundColor: c.bg,
                ...emojiBtnShadow,
              },
            ]}
          >
            <Text style={styles.emojiBtnText}>{spaceEmoji}</Text>
          </Pressable>

          <View style={styles.nameInputWrap}>
            <NInput
              value={spaceName}
              onChangeText={setSpaceName}
              placeholder="Tên Space"
            />
          </View>
        </View>

        {/* Emoji picker for space */}
        <View style={styles.emojiPickerRow}>
          {SPACE_EMOJIS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => setSpaceEmoji(emoji)}
              style={[
                styles.emojiOption,
                {
                  backgroundColor: c.bg,
                  ...(spaceEmoji === emoji
                    ? shadow('inset', 'sm')
                    : shadow('raised', 'sm')),
                },
              ]}
            >
              <Text style={styles.emojiOptionText}>{emoji}</Text>
            </Pressable>
          ))}
        </View>

        {/* Members */}
        <View style={styles.membersSection}>
          <Text style={[styles.sectionLabel, { color: c.textMid }]}>Thành viên</Text>

          {members.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <View
                style={[
                  styles.memberAvatar,
                  {
                    backgroundColor: c.bg,
                    ...memberAvatarShadow,
                  },
                ]}
              >
                <Text style={styles.memberAvatarText}>👤</Text>
              </View>
              <View style={styles.memberInputWrap}>
                <NInput
                  value={member.name}
                  onChangeText={(text) => handleMemberChange(member.id, text)}
                  placeholder="Tên thành viên"
                  autoCapitalize="words"
                />
              </View>
            </View>
          ))}

          <Pressable onPress={handleAddMember} style={styles.addMemberBtn}>
            <Text style={[styles.addMemberText, { color: c.accent }]}>+ Thêm thành viên</Text>
          </Pressable>
        </View>

        {/* Invite chips */}
        <View style={styles.inviteRow}>
          <Pressable
            style={[
              styles.inviteChip,
              {
                backgroundColor: c.bg,
                ...inviteChipShadow,
              },
            ]}
          >
            <Text style={[styles.inviteChipText, { color: c.textDark }]}>🔗 Sao chép link mời</Text>
          </Pressable>

          <Pressable
            style={[
              styles.inviteChip,
              {
                backgroundColor: c.bg,
                ...inviteChipShadow,
              },
            ]}
          >
            <Text style={[styles.inviteChipText, { color: c.textDark }]}>📱 QR code</Text>
          </Pressable>
        </View>

        {/* CTA */}
        <NButton
          label="Tạo Space →"
          onPress={handleCreate}
          isLoading={isLoading}
          isDisabled={!spaceName.trim()}
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
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
  backText: {
    fontSize: 15,
    fontWeight: '500',
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.035 * 28,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 15 * 1.5,
  },
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
  emojiBtnText: {
    fontSize: 30,
  },
  nameInputWrap: {
    flex: 1,
  },
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
  emojiOptionText: {
    fontSize: 22,
  },
  membersSection: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.08 * 14,
  },
  memberRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 22,
  },
  memberInputWrap: {
    flex: 1,
  },
  addMemberBtn: {
    minHeight: 44,
    justifyContent: 'center',
  },
  addMemberText: {
    fontSize: 15,
    fontWeight: '500',
  },
  inviteRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  inviteChip: {
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inviteChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
})
