import { useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useStore } from '@/stores'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { useSpace } from '@/hooks/useSpace'
import { useRefresh } from '@/hooks/useRefresh'
import { RADIUS } from '@/constants/theme'
import { NToggle } from '@/components/ui/NToggle'
import { getProfile, getRecentCompletions } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { ACCENT_COLORS, type AccentKey } from '@/stores/uiSlice'
import { FlameView } from '@/components/ui/FlameView'
import type { Profile, TaskCompletion } from '@/types'

function SettingsRow({
  icon,
  label,
  sub,
  toggle,
  onToggle,
  toggled,
  chevron,
  onPress,
  danger,
}: {
  icon: string
  label: string
  sub?: string
  toggle?: boolean
  onToggle?: () => void
  toggled?: boolean
  chevron?: boolean
  onPress?: () => void
  danger?: boolean
}) {
  const { shadow } = useNeumorphic()
  const { c } = useTheme()

  return (
    <Pressable
      onPress={onPress}
      style={styles.settingsRow}
      disabled={!onPress && !toggle}
    >
      <View style={[styles.iconBox, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
        <Text style={styles.iconBoxText}>{icon}</Text>
      </View>
      <View style={styles.settingsRowContent}>
        <Text style={[styles.settingsLabel, { color: danger ? '#E26C7C' : c.textDark }]}>{label}</Text>
        {sub ? <Text style={[styles.settingsSub, { color: c.textMid }]}>{sub}</Text> : null}
      </View>
      {toggle && onToggle ? (
        <NToggle value={toggled ?? false} onToggle={onToggle} />
      ) : chevron ? (
        <Text style={[styles.chevron, { color: c.textLight }]}>›</Text>
      ) : null}
    </Pressable>
  )
}

function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub: string
  accent?: boolean
}) {
  const { shadow } = useNeumorphic()
  const { c } = useTheme()

  const streakNum = accent ? value.replace('d 🔥', 'd') : value

  return (
    <View
      style={[
        styles.statTile,
        { backgroundColor: c.bg },
        accent ? shadow('accent', 'sm') : shadow('raised', 'sm'),
      ]}
    >
      <Text style={[styles.statLabel, { color: c.textMid }]}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, { color: accent ? c.accent : c.textDark }]}>
          {accent ? streakNum : value}
        </Text>
        {accent && <FlameView size={28} />}
      </View>
      <Text style={[styles.statSub, { color: c.textMid }]}>{sub}</Text>
    </View>
  )
}

function SectionCard({ children }: { children: ReactNode }) {
  const { shadow } = useNeumorphic()
  const { c } = useTheme()

  return (
    <View style={[styles.sectionCard, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}>
      {children}
    </View>
  )
}

function computeStreak(completions: TaskCompletion[]): number {
  const activeKeys = new Set(completions.map((c) => new Date(c.completed_at).toDateString()))
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  if (!activeKeys.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1)
  }
  let streak = 0
  while (activeKeys.has(cursor.toDateString())) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export default function ProfileScreen() {
  const router = useRouter()
  const user = useStore((s) => s.user)
  const clearSession = useStore((s) => s.clearSession)
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const setThemeOverride = useStore((s) => s.setThemeOverride)
  const accentKey = useStore((s) => s.accentKey)
  const setAccentKey = useStore((s) => s.setAccentKey)

  const { shadow } = useNeumorphic()
  const { isDark, c } = useTheme()
  const { spaces } = useSpace()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [myCompletions, setMyCompletions] = useState<TaskCompletion[]>([])
  const [statsLoading, setStatsLoading] = useState(false)

  const [notifTask, setNotifTask] = useState(true)
  const [notifOverdue, setNotifOverdue] = useState(true)
  const [notifCover, setNotifCover] = useState(false)

  const loadStats = useCallback(() => {
    if (!user?.id) return
    setStatsLoading(true)
    const promises: Promise<void>[] = [
      getProfile(user.id).then((p) => { if (p) setProfile(p) }),
    ]
    if (activeSpaceId) {
      promises.push(
        getRecentCompletions(activeSpaceId, 30).then((data) => {
          setMyCompletions(data.filter((c) => c.completed_by === user.id && !c.is_skipped))
        }),
      )
    } else {
      setMyCompletions([])
    }
    Promise.all(promises).finally(() => setStatsLoading(false))
  }, [user?.id, activeSpaceId])

  useFocusEffect(useCallback(() => { loadStats() }, [loadStats]))

  const { refreshing, handleRefresh } = useRefresh(loadStats)

  useEffect(() => {
    if (!activeSpaceId || !user?.id) return
    const userId = user.id
    const channel = supabase
      .channel(`profile_completions:${activeSpaceId}:${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_completions', filter: `space_id=eq.${activeSpaceId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const c = payload.new as TaskCompletion
            if (c.completed_by === userId && !c.is_skipped) {
              setMyCompletions((prev) => [c, ...prev])
            }
          }
          if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string }
            setMyCompletions((prev) => prev.filter((c) => c.id !== deleted.id))
          }
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeSpaceId, user?.id])

  const completionsCount = myCompletions.length
  const streak = computeStreak(myCompletions)

  const displayName = profile?.display_name || 'Bạn'
  const avatarEmoji = profile?.avatar_emoji || '🌸'
  const phoneOrEmail = user?.phone ?? user?.email ?? ''

  const handleToggle = (setter: (fn: (v: boolean) => boolean) => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setter((v) => !v)
  }

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut()
            clearSession()
            router.replace('/(auth)/welcome')
          },
        },
      ],
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.accent} />}
      >
        <Text style={[styles.title, { color: c.textDark }]}>Bạn</Text>
        <Text style={[styles.subtitle, { color: c.textMid }]}>Hồ sơ, thông báo và tài khoản.</Text>

        <View style={[styles.profileCard, { backgroundColor: c.bg, ...shadow('raised', 'md') }]}>
          <View style={styles.profileTop}>
            <View>
              <View style={[styles.avatarWrap, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}>
                <Text style={styles.avatarText}>{avatarEmoji}</Text>
              </View>
              <View style={[styles.editBadge, { backgroundColor: c.accent, ...shadow('accent', 'sm') }]}>
                <Text style={styles.editBadgeText}>✏</Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: c.textDark }]}>{displayName}</Text>
              <Text style={[styles.profileSub, { color: c.textMid }]}>{phoneOrEmail}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          {statsLoading ? (
            <View style={[styles.statsLoadingWrap, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}>
              <ActivityIndicator color={c.accent} size="small" />
            </View>
          ) : (
            <>
              <StatTile
                label="ĐÃ LÀM"
                value={String(completionsCount)}
                sub="task tháng này"
              />
              <StatTile
                label="STREAK"
                value={`${streak}d 🔥`}
                sub="liên tiếp"
                accent
              />
              <StatTile
                label="SPACES"
                value={String(spaces.length)}
                sub="đang tham gia"
              />
            </>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: c.textMid }]}>THÔNG BÁO</Text>
        <SectionCard>
          <SettingsRow
            icon="⏰"
            label="Nhắc task đến giờ"
            sub="Nhắc khi task sắp tới hạn"
            toggle
            toggled={notifTask}
            onToggle={() => handleToggle(setNotifTask)}
          />
          <View style={[styles.rowDivider, { backgroundColor: c.bg2 }]} />
          <SettingsRow
            icon="📣"
            label="Task quá hạn"
            sub="Nhắc khi task bị bỏ quá giờ"
            toggle
            toggled={notifOverdue}
            onToggle={() => handleToggle(setNotifOverdue)}
          />
          <View style={[styles.rowDivider, { backgroundColor: c.bg2 }]} />
          <SettingsRow
            icon="🤝"
            label="Khi ai cover"
            sub="Ai đó làm task của bạn"
            toggle
            toggled={notifCover}
            onToggle={() => handleToggle(setNotifCover)}
          />
          <View style={[styles.rowDivider, { backgroundColor: c.bg2 }]} />
          <SettingsRow
            icon="🔕"
            label="Quiet hours"
            sub="22:00 – 07:00"
            chevron
          />
        </SectionCard>

        <Text style={[styles.sectionTitle, { color: c.textMid }]}>GIAO DIỆN</Text>
        <SectionCard>
          <SettingsRow
            icon={isDark ? '🌙' : '☀️'}
            label="Chế độ tối"
            sub={isDark ? 'Đang bật' : 'Đang tắt'}
            toggle
            toggled={isDark}
            onToggle={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setThemeOverride(isDark ? 'light' : 'dark')
            }}
          />
          <View style={[styles.rowDivider, { backgroundColor: c.bg2 }]} />
          <View style={styles.settingsRow}>
            <View style={[styles.iconBox, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
              <Text style={styles.iconBoxText}>🎨</Text>
            </View>
            <View style={styles.settingsRowContent}>
              <Text style={[styles.settingsLabel, { color: c.textDark }]}>Màu nhấn</Text>
              <View style={styles.accentRow}>
                {(Object.entries(ACCENT_COLORS) as [AccentKey, string][]).map(([key, hex]) => (
                  <Pressable
                    key={key}
                    accessibilityLabel={`Chọn màu ${key}`}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      setAccentKey(key)
                    }}
                    style={[
                      styles.accentDot,
                      { backgroundColor: hex },
                      accentKey === key && styles.accentDotActive,
                    ]}
                  >
                    {accentKey === key && (
                      <Text style={styles.accentCheck}>✓</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </SectionCard>

        <Text style={[styles.sectionTitle, { color: c.textMid }]}>TÀI KHOẢN</Text>
        <SectionCard>
          <SettingsRow
            icon="⭐"
            label="Gói dùng thử"
            sub="Divvy Free"
            chevron
          />
          <View style={[styles.rowDivider, { backgroundColor: c.bg2 }]} />
          <SettingsRow
            icon="❓"
            label="Trợ giúp"
            chevron
          />
          <View style={[styles.rowDivider, { backgroundColor: c.bg2 }]} />
          <SettingsRow
            icon="📄"
            label="Điều khoản & Quyền riêng tư"
            chevron
          />
        </SectionCard>

        <Pressable
          onPress={handleSignOut}
          style={[styles.signOutBtn, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}
        >
          <Text style={styles.signOutText}>Đăng xuất</Text>
        </Pressable>

        <Text style={[styles.versionText, { color: c.textLight }]}>
          Divvy v0.1 · Made with 🌸 in Saigon
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 120, gap: 0 },

  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.65 },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 20 },

  profileCard: {
    borderRadius: RADIUS.card,
    padding: 20,
    marginBottom: 16,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 36 },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadgeText: { fontSize: 10, color: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  profileSub: { fontSize: 13, marginTop: 3 },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statsLoadingWrap: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  statTile: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  statFlame: { fontSize: 18, lineHeight: 24 },
  statSub: { fontSize: 9, textAlign: 'center' },

  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderRadius: RADIUS.card,
    paddingVertical: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  rowDivider: { height: 1, marginHorizontal: 16 },

  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxText: { fontSize: 17 },
  settingsRowContent: { flex: 1 },
  settingsLabel: { fontSize: 14, fontWeight: '600' },
  settingsSub: { fontSize: 11, marginTop: 1 },
  chevron: { fontSize: 22, fontWeight: '300', marginRight: 2 },

  accentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  accentDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentDotActive: {
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  accentCheck: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  signOutBtn: {
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: '#E26C7C' },

  versionText: { textAlign: 'center', fontSize: 12, marginBottom: 8 },
})
