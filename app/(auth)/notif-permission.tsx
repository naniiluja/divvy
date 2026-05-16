import { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Notifications from 'expo-notifications'
import { NHeader } from '@/components/ui/NHeader'
import { NButton } from '@/components/ui/NButton'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'

const FEATURES = [
  { emoji: '⏰', title: 'Nhắc task đến giờ', sub: 'Nhắc nhẹ trước thời điểm task cần làm.' },
  { emoji: '📣', title: 'Khi task quá hạn', sub: 'Cả nhóm biết để cùng cover.' },
  { emoji: '🤝', title: 'Khi ai đó cover task', sub: 'Biết ngay khi có người làm giúp.' },
]

export default function NotifPermissionScreen() {
  const router = useRouter()
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const scale = useRef(new Animated.Value(1)).current
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [scale])

  const handleEnable = async () => {
    setIsLoading(true)
    try {
      await Notifications.requestPermissionsAsync()
    } catch {
      // ignore — flow continues regardless of grant result
    } finally {
      setIsLoading(false)
      router.replace('/(auth)/done')
    }
  }

  const handleSkip = () => router.replace('/(auth)/done')

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.content}>
        <NHeader step={5} total={5} />

        <View style={styles.bellWrap}>
          <View style={[styles.bellCircle, { backgroundColor: c.bg, ...shadow('raised', 'lg') }]}>
            <Text style={styles.bellEmoji}>🔔</Text>
          </View>
          <Animated.View
            style={[
              styles.pulseBadge,
              { backgroundColor: c.accent, transform: [{ scale }], ...shadow('accent', 'sm') },
            ]}
          >
            <Text style={styles.pulseBadgeText}>3</Text>
          </Animated.View>
        </View>

        <Text style={[styles.title, { color: c.textDark }]}>Đừng để task quên ai</Text>
        <Text style={[styles.subtitle, { color: c.textMid }]}>
          Bật thông báo để bạn và mọi người trong Space nhận nhắc nhở đúng giờ.
        </Text>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.title} style={[styles.feature, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}>
              <View style={[styles.featureIcon, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
                <Text style={styles.featureEmoji}>{f.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureTitle, { color: c.textDark }]}>{f.title}</Text>
                <Text style={[styles.featureSub, { color: c.textMid }]}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.footer}>
          <Pressable
            onPress={handleSkip}
            style={[styles.ghostBtn, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}
          >
            <Text style={[styles.ghostText, { color: c.textMid }]}>Để sau</Text>
          </Pressable>
          <View style={{ flex: 1.3 }}>
            <NButton label="Bật thông báo" onPress={handleEnable} isLoading={isLoading} fullWidth />
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 18,
  },
  bellWrap: {
    alignSelf: 'center',
    marginTop: 24,
  },
  bellCircle: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center',
  },
  bellEmoji: { fontSize: 56 },
  pulseBadge: {
    position: 'absolute',
    top: 4, right: 4,
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  pulseBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.91, textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, textAlign: 'center', paddingHorizontal: 12 },
  features: { gap: 10, marginTop: 8 },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  featureIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureEmoji: { fontSize: 18 },
  featureTitle: { fontSize: 14, fontWeight: '700' },
  featureSub: { fontSize: 12, marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ghostBtn: {
    flex: 1,
    height: 60,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { fontSize: 14, fontWeight: '600' },
})
