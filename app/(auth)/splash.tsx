import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Easing } from 'react-native'
import { useRouter } from 'expo-router'
import { useSession } from '@/hooks/useSession'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { RADIUS } from '@/constants/theme'
import { DivvyMark } from '@/components/ui/DivvyMark'
import { supabase } from '@/lib/supabase'
import { getProfile, getSpacesForUser } from '@/lib/api'

export default function SplashScreen() {
  const router = useRouter()
  const { session, isLoading } = useSession()
  const { shadow } = useNeumorphic()
  const { c } = useTheme()

  useEffect(() => {
    const navigate = async () => {
      if (!session?.user) {
        router.replace('/(auth)/welcome')
        return
      }
      const userId = session.user.id
      try {
        const { data: liveUser, error: liveErr } = await supabase.auth.getUser()
        if (liveErr || !liveUser?.user) {
          await supabase.auth.signOut()
          router.replace('/(auth)/welcome')
          return
        }
        const [profile, spaces] = await Promise.all([
          getProfile(userId),
          getSpacesForUser(userId),
        ])
        if (!profile) {
          router.replace('/(auth)/profile-setup')
          return
        }
        if (spaces.length === 0) {
          router.replace('/(auth)/space-type')
          return
        }
        router.replace('/(app)/(tabs)/' as never)
      } catch {
        await supabase.auth.signOut()
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
  const spinAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start()
  }, [])

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
        <View style={[styles.spinnerWrap, { backgroundColor: c.bg, ...insetSm }]}>
          <Animated.View
            style={[
              styles.spinner,
              { borderTopColor: c.accent, borderRightColor: c.accent },
              { transform: [{ rotate: spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] },
            ]}
          />
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
