import { useState, useRef, useEffect } from 'react'
import { View, Text, Pressable, Dimensions, StyleSheet, Animated } from 'react-native'
import { useRouter } from 'expo-router'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS, ThemeColors } from '@/constants/theme'
import { DivvyMark } from '@/components/ui/DivvyMark'

const { width: SW } = Dimensions.get('window')

const SLIDES = [
  {
    badge: 'Cùng nhà · cùng việc',
    titles: ['Ngừng hỏi nhau.', 'Mở app là biết.'],
    body: 'Ai cho chó ăn rồi? Ai đổ rác chưa? Không cần nhắn tin — mọi người mở Divvy, thấy trạng thái, tick xong.',
    art: 'house' as const,
  },
  {
    badge: 'Realtime sync',
    titles: ['Một cú tap.', 'Cả nhà thấy ngay.'],
    body: 'Tap một lần để hoàn thành. Tên bạn và thời gian xuất hiện realtime cho mọi thành viên trong Space.',
    art: 'tap' as const,
  },
  {
    badge: 'Powered by Claude',
    titles: ['Để Claude', 'chia việc giúp bạn.'],
    body: 'Gõ một câu mô tả thói quen — Divvy sinh ra danh sách task có icon, tần suất và chia đều cho từng người.',
    art: 'sparkle' as const,
  },
]

function NeuRing({ c, shadow }: { c: ThemeColors; shadow: ReturnType<typeof useNeumorphic>['shadow'] }) {
  return (
    <View style={[styles.ring, { backgroundColor: c.bg, ...shadow('inset', 'md') }]}>
      <View style={[styles.ringInner, { ...shadow('raised', 'sm') }]} />
    </View>
  )
}

function FloatChip({ emoji, style, c, shadow }: { emoji: string; style: object; c: ThemeColors; shadow: ReturnType<typeof useNeumorphic>['shadow'] }) {
  return (
    <View style={[styles.floatChip, { backgroundColor: c.bg, ...shadow('raised', 'sm') }, style]}>
      <Text style={styles.floatEmoji}>{emoji}</Text>
    </View>
  )
}

function TaskRow({ emoji, name, by, done, highlight, c, shadow }: {
  emoji: string; name: string; by?: string; done?: boolean; highlight?: boolean
  c: ThemeColors; shadow: ReturnType<typeof useNeumorphic>['shadow']
}) {
  return (
    <View style={[styles.taskRow, { backgroundColor: c.bg, ...(highlight ? shadow('inset', 'sm') : shadow('raised', 'sm')) }]}>
      <View style={[styles.taskIcon, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
        <Text style={{ fontSize: 16 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.taskName, { color: c.textDark }]}>{name}</Text>
        {by && <Text style={[styles.taskBy, { color: c.textMid }]}>{by}</Text>}
      </View>
      <View style={[styles.taskCheck, {
        backgroundColor: done ? c.accent : c.bg,
        ...(done ? shadow('accent') : shadow('inset', 'sm')),
      }]}>
        {done && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✓</Text>}
      </View>
    </View>
  )
}

function ArtHouse({ c, shadow }: { c: ThemeColors; shadow: ReturnType<typeof useNeumorphic>['shadow'] }) {
  return (
    <View style={styles.artStage}>
      <NeuRing c={c} shadow={shadow} />
      <View style={[styles.artCenter, { backgroundColor: c.bg, ...shadow('raised', 'md') }]}>
        <Text style={{ fontSize: 56 }}>🏠</Text>
      </View>
      <FloatChip emoji="🧹" style={{ position: 'absolute', top: 18, left: 10 }} c={c} shadow={shadow} />
      <FloatChip emoji="🗑️" style={{ position: 'absolute', top: 30, right: 4 }} c={c} shadow={shadow} />
      <FloatChip emoji="🍳" style={{ position: 'absolute', bottom: 30, left: 0 }} c={c} shadow={shadow} />
      <FloatChip emoji="🧺" style={{ position: 'absolute', bottom: 14, right: 14 }} c={c} shadow={shadow} />
    </View>
  )
}

function ArtTap({ c, shadow }: { c: ThemeColors; shadow: ReturnType<typeof useNeumorphic>['shadow'] }) {
  return (
    <View style={styles.artStage}>
      <NeuRing c={c} shadow={shadow} />
      <View style={{ position: 'absolute', width: 240, gap: 10 }}>
        <TaskRow emoji="🐶" name="Cho chó ăn sáng" by="Anh · 7:14" done c={c} shadow={shadow} />
        <TaskRow emoji="🗑️" name="Đổ rác" by="Em · 8:02" done highlight c={c} shadow={shadow} />
        <TaskRow emoji="🦮" name="Dắt đi dạo" c={c} shadow={shadow} />
      </View>
    </View>
  )
}

function ArtSparkle({ c, shadow }: { c: ThemeColors; shadow: ReturnType<typeof useNeumorphic>['shadow'] }) {
  const tasks = [
    { e: '🐶', n: 'Cho ăn sáng', a: 'Anh' },
    { e: '🦮', n: 'Dắt đi dạo', a: 'rotate' },
    { e: '🗑️', n: 'Đổ rác', a: 'Em' },
  ]
  return (
    <View style={styles.artStage}>
      <NeuRing c={c} shadow={shadow} />
      <View style={{ position: 'absolute', width: 230, gap: 10, alignItems: 'flex-start' }}>
        <View style={[styles.chatBubble, { backgroundColor: c.accent, alignSelf: 'flex-end', ...shadow('accent', 'sm') }]}>
          <Text style={styles.chatText}>cho chó ăn sáng tối, dắt đi dạo, đổ rác</Text>
        </View>
        <View style={[styles.typingPill, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
          <View style={[styles.typingDot, { backgroundColor: c.accent }]} />
          <Text style={[styles.typingText, { color: c.textMid }]}>Claude đang chia việc…</Text>
        </View>
        {tasks.map(t => (
          <View key={t.n} style={[styles.sparkleRow, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}>
            <Text style={{ fontSize: 16 }}>{t.e}</Text>
            <Text style={[styles.sparkleLabel, { color: c.textDark }]}>{t.n}</Text>
            <Text style={[styles.sparkleAssignee, { color: c.textLight }]}>→ {t.a}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function NDots({ count, activeIndex, c, shadow }: { count: number; activeIndex: number; c: ThemeColors; shadow: ReturnType<typeof useNeumorphic>['shadow'] }) {
  return (
    <View style={[styles.dotsContainer, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              width: i === activeIndex ? 22 : 8,
              backgroundColor: i === activeIndex ? c.accent : c.textLight,
              opacity: i === activeIndex ? 1 : 0.4,
            },
          ]}
        />
      ))}
    </View>
  )
}

function ArrowRight({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 14, height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{
        position: 'absolute', right: 0,
        width: 8, height: 8,
        borderTopWidth: 2, borderRightWidth: 2,
        borderColor: color, borderRadius: 1,
        transform: [{ rotate: '45deg' }],
      }} />
    </View>
  )
}

export default function WelcomeScreen() {
  const router = useRouter()
  const [activeIndex, setActiveIndex] = useState(0)
  const fadeAnim = useRef(new Animated.Value(1)).current
  const slideAnim = useRef(new Animated.Value(0)).current
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const goTo = (next: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -20, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setActiveIndex(next)
      slideAnim.setValue(20)
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start()
    })
  }

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      goTo(activeIndex + 1)
    } else {
      router.replace('/(auth)/sign-in')
    }
  }

  const slide = SLIDES[activeIndex]

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.slide}>
        {/* Header: logo + skip */}
        <View style={styles.slideHeader}>
          <DivvyMark size={42} />
          <Pressable onPress={() => router.replace('/(auth)/sign-in')} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: c.textMid }]}>Bỏ qua →</Text>
          </Pressable>
        </View>

        {/* Art + text — animated fade+slide */}
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
          {/* Art illustration */}
          <View style={styles.artWrap}>
            {slide.art === 'house' && <ArtHouse c={c} shadow={shadow} />}
            {slide.art === 'tap' && <ArtTap c={c} shadow={shadow} />}
            {slide.art === 'sparkle' && <ArtSparkle c={c} shadow={shadow} />}
          </View>

          {/* Text section */}
          <View style={styles.textSection}>
            <View style={[styles.badge, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
              <Text style={[styles.badgeText, { color: c.accent }]}>{slide.badge}</Text>
            </View>

            <View>
              {slide.titles.map((line, i) => (
                <Text key={i} style={[styles.title, { color: c.textDark }]}>
                  {line.includes('Claude')
                    ? line.split('Claude').map((part, j, arr) => (
                        <Text key={j}>
                          {part}
                          {j < arr.length - 1 && <Text style={{ color: c.accent }}>Claude</Text>}
                        </Text>
                      ))
                    : line}
                </Text>
              ))}
            </View>

            <Text style={[styles.body, { color: c.textMid }]}>{slide.body}</Text>
          </View>
        </Animated.View>

        {/* Bottom: dots + next button — không animate */}
        <View style={styles.bottom}>
          <NDots count={SLIDES.length} activeIndex={activeIndex} c={c} shadow={shadow} />
          <Pressable
            onPress={handleNext}
            style={[styles.nextBtn, { backgroundColor: c.accent, ...shadow('accent') }]}
          >
            <ArrowRight color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  slide: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 52,
    paddingBottom: 32,
    width: SW,
  },
  slideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  skipBtn: { padding: 8, minHeight: 44, justifyContent: 'center' },
  skipText: { fontSize: 14, fontWeight: '500' },
  artWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  artStage: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: RADIUS.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    position: 'absolute',
    inset: 18,
    width: 210 - 36,
    height: 210 - 36,
    borderRadius: RADIUS.avatar,
  },
  artCenter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatChip: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatEmoji: { fontSize: 26 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
  },
  taskIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskName: { fontSize: 13, fontWeight: '600' },
  taskBy: { fontSize: 11, marginTop: 1 },
  taskCheck: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBubble: {
    padding: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    maxWidth: 200,
  },
  chatText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  typingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  typingDot: { width: 6, height: 6, borderRadius: 3 },
  typingText: { fontSize: 12 },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  sparkleLabel: { flex: 1, fontSize: 12, fontWeight: '600' },
  sparkleAssignee: { fontSize: 12 },
  textSection: {
    gap: 14,
    marginBottom: 28,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.88,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1.19,
    lineHeight: 38,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
  nextBtn: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: { color: '#fff', fontSize: 22, fontWeight: '700' },
})
