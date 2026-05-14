import { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useStore } from '@/stores'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import { getSpaceById, getSpaceMembers, getRecentCompletions } from '@/lib/api'
import type { Space, SpaceMember, TaskCompletion } from '@/types'

type MemberWithProfile = SpaceMember & { profiles?: { display_name?: string; avatar_emoji?: string } }

export default function MembersScreen() {
  const router = useRouter()
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const [space, setSpace] = useState<Space | null>(null)
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [completions, setCompletions] = useState<TaskCompletion[]>([])

  useEffect(() => {
    if (!activeSpaceId) return
    Promise.all([
      getSpaceById(activeSpaceId),
      getSpaceMembers(activeSpaceId),
      getRecentCompletions(activeSpaceId, 7),
    ]).then(([s, m, c]) => {
      setSpace(s)
      setMembers(m as MemberWithProfile[])
      setCompletions(c)
    })
  }, [activeSpaceId])

  const memberStats = members.map((m) => ({
    ...m,
    done7d: completions.filter((c) => c.completed_by === m.user_id && !c.is_skipped).length,
    displayName: m.profiles?.display_name ?? m.user_id.slice(0, 6),
    emoji: m.profiles?.avatar_emoji ?? '👤',
  }))

  const maxDone = Math.max(...memberStats.map((m) => m.done7d), 1)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.title, { color: c.textDark }]}>Thành viên</Text>
            <Text style={[styles.subtitle, { color: c.textMid }]}>
              {members.length} người trong "{space?.name ?? '…'}"
            </Text>
          </View>
          <Pressable
            onPress={() => activeSpaceId && router.push(`/(app)/space/invite/${activeSpaceId}` as never)}
            style={[styles.inviteBtn, { backgroundColor: c.accent, ...shadow('accent', 'sm') }]}
          >
            <Text style={styles.inviteBtnText}>+ Mời</Text>
          </Pressable>
        </View>

        <View style={[styles.leaderCard, { backgroundColor: c.bg, ...shadow('raised', 'md') }]}>
          <View style={styles.leaderHeader}>
            <Text style={[styles.leaderTitle, { color: c.textMid }]}>TUẦN NÀY</Text>
            <Text style={[styles.leaderSub, { color: c.textLight }]}>Task đã hoàn thành</Text>
          </View>
          {memberStats.map((m, i) => (
            <View key={m.user_id} style={[styles.barRow, { marginTop: i === 0 ? 0 : 12 }]}>
              <View style={[styles.memberAvatar, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
                <Text style={{ fontSize: 15 }}>{m.emoji}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.memberName, { color: c.textDark }]} numberOfLines={1}>
                  {m.displayName}
                  {m.role === 'owner' && <Text style={[styles.roleTag, { color: c.textMid }]}> · owner</Text>}
                </Text>
                <View style={[styles.barBg, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
                  <View style={[
                    styles.barFill,
                    { width: `${(m.done7d / maxDone) * 100}%` },
                    i === 0 ? { backgroundColor: c.accent } : { backgroundColor: c.textLight },
                  ]} />
                </View>
              </View>
              <Text style={[styles.barCount, { color: c.textDark }]}>{m.done7d}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMid }]}>TẤT CẢ ({members.length})</Text>
        <View style={styles.memberList}>
          {memberStats.map((m) => (
            <View key={m.user_id} style={[styles.memberCard, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}>
              <View style={[styles.memberAvatarLg, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}>
                <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                <View style={styles.onlineDot} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.memberCardName, { color: c.textDark }]} numberOfLines={1}>
                  {m.displayName}
                  {m.role === 'owner' && (
                    <Text style={[styles.roleChip, { color: c.accent }]}> · owner</Text>
                  )}
                </Text>
                <Text style={[styles.memberCardSub, { color: c.textMid }]}>
                  {m.done7d} task tuần này
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 120, gap: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.65 },
  subtitle: { fontSize: 13, marginTop: 4 },
  inviteBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.pill },
  inviteBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  leaderCard: { borderRadius: RADIUS.card, padding: 18, marginBottom: 18 },
  leaderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  leaderTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  leaderSub: { fontSize: 11 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  memberAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  memberName: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  roleTag: { fontWeight: '500', fontSize: 11 },
  barBg: { height: 8, borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  barCount: { fontSize: 14, fontWeight: '800', minWidth: 28, textAlign: 'right', letterSpacing: -0.3 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10, paddingHorizontal: 6 },
  memberList: { gap: 10 },
  memberCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingHorizontal: 16, borderRadius: 22 },
  memberAvatarLg: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  onlineDot: { position: 'absolute', right: -2, bottom: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#54D49B', borderWidth: 2.5, borderColor: 'white' },
  memberCardName: { fontSize: 15, fontWeight: '700', letterSpacing: -0.15 },
  roleChip: { fontSize: 11, fontWeight: '600' },
  memberCardSub: { fontSize: 11, marginTop: 2 },
})
