import { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useSession } from '@/hooks/useSession'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import { DivvyMark } from '@/components/ui/DivvyMark'

export default function SplashScreen() {
  const router = useRouter()
  const { session, isLoading } = useSession()
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  useEffect(() => {
    const navigate = () => {
      if (session) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.replace('/(app)/(tabs)/' as any)
      } else {
        router.replace('/(auth)/welcome')
      }
    }

    if (!isLoading) {
      const timer = setTimeout(navigate, 2200)
      return () => clearTimeout(timer)
    }

    const fallback = setTimeout(() => {
      router.replace('/(auth)/welcome')
    }, 8000)
    return () => clearTimeout(fallback)
  }, [isLoading, session, router])

  const insetSm = shadow('inset', 'sm')

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={{ flex: 1 }} />

      <View style={styles.center}>
        <DivvyMark size={132} />

        <View style={styles.textBlock}>
          <Text style={[styles.logoText, { color: c.textDark }]}>divvy</Text>
          <Text style={[styles.tagline, { color: c.textMid }]}>
            Stop asking · just check
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 56 }}>
        {/* Spinner wrapped in inset circle */}
        <View style={[styles.spinnerWrap, { backgroundColor: c.bg, ...insetSm }]}>
          <View style={[styles.spinner, { borderTopColor: c.accent, borderRightColor: c.accent }]} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    gap: 26,
  },
  textBlock: {
    alignItems: 'center',
    gap: 10,
  },
  logoText: {
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: -1.76,
    lineHeight: 44,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 2.24,
    textTransform: 'uppercase',
  },
  spinnerWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.avatar,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
})
