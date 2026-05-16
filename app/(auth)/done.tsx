import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Animated, Easing } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NButton } from '@/components/ui/NButton'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import { useStore } from '@/stores'
import { getSpaceById, getTasksForSpace } from '@/lib/api'
import type { Space, Task } from '@/types'

const CONFETTI_COLORS = ['#6C7CFF', '#A78BFA', '#F472B6', '#FBBF24', '#34D399', '#60A5FA']
const FREQ_LABEL: Record<string, string> = {
  daily: 'Hằng ngày',
  weekly: 'Hằng tuần',
  '3x_week': '3 lần/tuần',
}

function Confetti({ delay, color, x }: { delay: number; color: string; x: number }) {
  const tY = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current
  const rotate = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(tY, { toValue: -120, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.delay(900),
            Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
          ]),
          Animated.timing(rotate, { toValue: 1, duration: 1600, useNativeDriver: true }),
        ]),
        Animated.delay(800),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [delay, tY, opacity, rotate])

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: x,
          backgroundColor: color,
          opacity,
          transform: [
            { translateY: tY },
            { rotate: rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
          ],
        },
      ]}
    />
  )
}

export default function DoneScreen() {
  const router = useRouter()
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const user = useStore((s) => s.user)
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const [space, setSpace] = useState<Space | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    if (!activeSpaceId) return
    Promise.all([
      getSpaceById(activeSpaceId),
      getTasksForSpace(activeSpaceId),
    ]).then(([s, t]) => {
      setSpace(s)
      setTasks(t.slice(0, 3))
    })
  }, [activeSpaceId])

  const displayName = (user?.user_metadata?.display_name as string | undefined) ?? 'bạn'

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.content}>
        <View style={styles.checkWrap}>
          {CONFETTI_COLORS.map((color, i) => (
            <Confetti
              key={i}
              delay={i * 180}
              color={color}
              x={20 + i * 16}
            />
          ))}
          <View style={[styles.checkCircle, { backgroundColor: c.accent, ...shadow('accent', 'lg') }]}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: c.textDark }]} numberOfLines={2}>
          Xong rồi, {displayName}! 🎉
        </Text>
        <Text style={[styles.subtitle, { color: c.textMid }]}>
          Space đã sẵn sàng. Cùng giữ nó gọn gàng nhé.
        </Text>

        {space && (
          <View style={[styles.previewCard, { backgroundColor: c.bg, ...shadow('raised', 'md') }]}>
            <View style={styles.previewHeader}>
              <View style={[styles.previewEmoji, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
                <Text style={styles.previewEmojiText}>{space.emoji}</Text>
              </View>
              <Text style={[styles.previewName, { color: c.textDark }]}>{space.name}</Text>
            </View>

            {tasks.length === 0 ? (
              <Text style={[styles.previewEmpty, { color: c.textLight }]}>
                Bạn có thể thêm task khi vào Today.
              </Text>
            ) : (
              tasks.map((t) => (
                <View key={t.id} style={[styles.previewTask, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
                  <Text style={styles.previewTaskIcon}>{t.icon}</Text>
                  <Text style={[styles.previewTaskName, { color: c.textDark }]} numberOfLines={1}>
                    {t.name}
                  </Text>
                  <Text style={[styles.previewTaskFreq, { color: c.accent }]}>
                    {FREQ_LABEL[t.frequency] ?? t.frequency}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ flex: 1 }} />

        <NButton
          label="Vào Divvy →"
          onPress={() => router.replace('/(app)/(tabs)/' as never)}
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
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    gap: 18,
  },
  checkWrap: {
    alignSelf: 'center',
    width: 140, height: 140,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 12,
  },
  checkCircle: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { fontSize: 48, color: '#fff', fontWeight: '700' },
  confetti: {
    position: 'absolute',
    bottom: 50,
    width: 6,
    height: 14,
    borderRadius: 2,
  },
  title: { fontSize: 30, fontWeight: '700', letterSpacing: -1.05, textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  previewCard: {
    borderRadius: RADIUS.card,
    padding: 18,
    gap: 10,
    marginTop: 8,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  previewEmoji: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  previewEmojiText: { fontSize: 20 },
  previewName: { fontSize: 17, fontWeight: '700', letterSpacing: -0.34 },
  previewEmpty: { fontSize: 13, fontStyle: 'italic' },
  previewTask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  previewTaskIcon: { fontSize: 18 },
  previewTaskName: { flex: 1, fontSize: 13, fontWeight: '600' },
  previewTaskFreq: { fontSize: 11, fontWeight: '700' },
})
