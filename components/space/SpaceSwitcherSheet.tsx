import { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import type { FC } from 'react'
import * as Haptics from 'expo-haptics'
import { NSheet } from '@/components/ui/NSheet'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import { useStore } from '@/stores'
import { getSpacesForUser, getTasksForSpace, getSpaceMembers, getTodayCompletions } from '@/lib/api'
import type { Space } from '@/types'

interface SpaceStat {
  space: Space
  memberCount: number
  todoToday: number
}

interface SpaceSwitcherSheetProps {
  visible: boolean
  onClose: () => void
}

export const SpaceSwitcherSheet: FC<SpaceSwitcherSheetProps> = ({ visible, onClose }) => {
  const router = useRouter()
  const userId = useStore((s) => s.user?.id)
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const setActiveSpaceId = useStore((s) => s.setActiveSpaceId)
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const [stats, setStats] = useState<SpaceStat[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!visible || !userId) return
    let cancelled = false
    setIsLoading(true)
    getSpacesForUser(userId)
      .then(async (spaces) => {
        const result = await Promise.all(
          spaces.map(async (space) => {
            const [members, tasks, completions] = await Promise.all([
              getSpaceMembers(space.id),
              getTasksForSpace(space.id),
              getTodayCompletions(space.id),
            ])
            const doneToday = new Set(completions.filter((c) => !c.is_skipped).map((c) => c.task_id))
            const todoToday = tasks.filter((t) => !doneToday.has(t.id)).length
            return { space, memberCount: members.length, todoToday }
          }),
        )
        if (!cancelled) setStats(result)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [visible, userId])

  const handleSelect = (spaceId: string) => {
    if (spaceId === activeSpaceId) {
      onClose()
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setActiveSpaceId(spaceId)
    onClose()
    router.replace('/(app)/(tabs)/' as never)
  }

  return (
    <NSheet visible={visible} onClose={onClose}>
      <Text style={[styles.title, { color: c.textDark }]}>Spaces của bạn</Text>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={c.accent} />
          </View>
        ) : (
          stats.map(({ space, memberCount, todoToday }) => {
            const isActive = space.id === activeSpaceId
            return (
              <Pressable
                key={space.id}
                onPress={() => handleSelect(space.id)}
                style={[styles.card, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}
              >
                <View style={[styles.emojiBox, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
                  <Text style={styles.emoji}>{space.emoji}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.name, { color: c.textDark }]} numberOfLines={1}>{space.name}</Text>
                  <Text style={[styles.sub, { color: c.textMid }]}>
                    {memberCount} người · {todoToday} task hôm nay
                  </Text>
                </View>
                {todoToday > 0 && (
                  <View style={[styles.badge, { backgroundColor: c.accent }]}>
                    <Text style={styles.badgeText}>{todoToday}</Text>
                  </View>
                )}
                {isActive && <View style={[styles.activeDot, { backgroundColor: c.accent }]} />}
              </Pressable>
            )
          })
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => { onClose(); router.push('/(app)/space/new') }}
          style={[styles.footerBtn, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}
        >
          <Text style={[styles.footerText, { color: c.accent }]}>+ Tạo Space</Text>
        </Pressable>
        <Pressable
          onPress={() => { onClose(); router.push('/(app)/space/join') }}
          style={[styles.footerBtn, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}
        >
          <Text style={[styles.footerText, { color: c.accent }]}>🔗 Tham gia</Text>
        </Pressable>
      </View>
    </NSheet>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4, marginBottom: 14, paddingHorizontal: 4 },
  list: { maxHeight: 340 },
  listContent: { gap: 10, paddingBottom: 16 },
  center: { padding: 40, alignItems: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  emojiBox: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 26 },
  name: { fontSize: 15, fontWeight: '700', letterSpacing: -0.15 },
  sub: { fontSize: 11, marginTop: 2 },
  badge: {
    minWidth: 22, height: 22, borderRadius: 11,
    paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  activeDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 4 },
  footer: { flexDirection: 'row', gap: 10, marginTop: 12 },
  footerBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: { fontSize: 14, fontWeight: '600' },
})
