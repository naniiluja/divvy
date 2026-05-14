import { useState, useRef } from 'react'
import { View, Text, Pressable, TextInput, Alert, StyleSheet, Animated, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import Constants from 'expo-constants'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import { NButton } from '@/components/ui/NButton'
import { NHeader } from '@/components/ui/NHeader'
import { supabase } from '@/lib/supabase'

type Method = 'email' | 'google'

const WEB_CLIENT_ID = (Constants.expoConfig?.extra?.googleWebClientId as string) ?? ''

GoogleSignin.configure({ webClientId: WEB_CLIENT_ID })

export default function SignInScreen() {
  const router = useRouter()
  const [method, setMethod] = useState<Method>('email')
  const [value, setValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toggleWidth, setToggleWidth] = useState(0)
  const slideAnim = useRef(new Animated.Value(0)).current
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const valid = method === 'email'
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    : true

  const switchMethod = (m: Method) => {
    if (m === method) return
    Animated.spring(slideAnim, {
      toValue: m === 'email' ? 0 : 1,
      useNativeDriver: false,
      tension: 68,
      friction: 11,
    }).start()
    setMethod(m)
    setValue('')
  }

  const handleEmailContinue = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: value.trim() })
      if (error) throw error
      router.push({ pathname: '/(auth)/otp', params: { method: 'email', value: value.trim() } })
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Đã có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
      }

      const response = await GoogleSignin.signIn()
      const idToken = response.data?.idToken
      if (!idToken) throw new Error('Không lấy được Google ID token')

      const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      })
      if (authError) throw authError

      const userId = authData.user?.id
      if (!userId) throw new Error('Không lấy được user ID')

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (profile) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.replace('/(app)/(tabs)/' as any)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.replace('/(auth)/profile-setup' as any)
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        err.code === statusCodes.SIGN_IN_CANCELLED
      ) {
        return
      }
      Alert.alert('Lỗi đăng nhập Google', err instanceof Error ? err.message : 'Đã có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  const PADDING = 5
  const pillWidth = toggleWidth > 0 ? (toggleWidth - PADDING * 2) / 2 : 0

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.content}>
        <NHeader step={1} total={5} onBack={() => router.replace('/(auth)/welcome')} />

        <View style={styles.headingBlock}>
          <Text style={[styles.title, { color: c.textDark }]}>Chào bạn 👋</Text>
          <Text style={[styles.subtitle, { color: c.textMid }]}>
            {method === 'email'
              ? 'Nhập email để nhận magic link.'
              : 'Đăng nhập bằng tài khoản Google của bạn.'}
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          <View
            onLayout={e => setToggleWidth(e.nativeEvent.layout.width)}
            style={[styles.toggle, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}
          >
            {pillWidth > 0 && (
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    top: PADDING,
                    bottom: PADDING,
                    width: pillWidth,
                    borderRadius: RADIUS.pill,
                    backgroundColor: c.bg,
                    left: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [PADDING, PADDING + pillWidth],
                    }),
                  },
                  shadow('raised', 'sm'),
                ]}
              />
            )}
            {(['email', 'google'] as Method[]).map(m => (
              <Pressable
                key={m}
                onPress={() => switchMethod(m)}
                style={styles.toggleOption}
              >
                <Text style={[
                  styles.toggleText,
                  { color: method === m ? c.accent : c.textMid },
                ]}>
                  {m === 'email' ? 'Email' : 'Google'}
                </Text>
              </Pressable>
            ))}
          </View>

          {method === 'email' ? (
            <View style={[styles.emailInput, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
              <TextInput
                value={value}
                onChangeText={setValue}
                placeholder="ban@email.com"
                placeholderTextColor={c.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.inputText, { color: c.textDark }]}
                autoFocus
              />
            </View>
          ) : (
            <View style={[styles.googleInfo, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
              <Text style={[styles.googleIcon]}>🔑</Text>
              <Text style={[styles.googleHint, { color: c.textMid }]}>
                Nhấn nút bên dưới để chọn tài khoản Google
              </Text>
            </View>
          )}

          <Text style={[styles.legal, { color: c.textLight }]}>
            Bằng việc tiếp tục, bạn đồng ý với{' '}
            <Text style={{ color: c.textMid, fontWeight: '500' }}>Điều khoản</Text>
            {' '}và{' '}
            <Text style={{ color: c.textMid, fontWeight: '500' }}>Chính sách bảo mật</Text>
            {' '}của Divvy.
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <NButton
          label={method === 'email' ? 'Gửi mã →' : 'Tiếp tục với Google →'}
          onPress={method === 'email' ? handleEmailContinue : handleGoogleSignIn}
          isLoading={isLoading}
          isDisabled={!valid}
          fullWidth
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 52,
    paddingBottom: 32,
    gap: 28,
  },
  headingBlock: { gap: 8 },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1.05,
    lineHeight: 33,
  },
  subtitle: { fontSize: 15, lineHeight: 22.5 },
  toggle: {
    height: 52,
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    padding: 5,
    position: 'relative',
  },
  toggleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.28,
  },
  emailInput: {
    height: 60,
    borderRadius: RADIUS.input,
    paddingHorizontal: 22,
    justifyContent: 'center',
  },
  googleInfo: {
    height: 60,
    borderRadius: RADIUS.input,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  googleIcon: { fontSize: 22 },
  googleHint: { fontSize: 14, flex: 1, lineHeight: 20 },
  inputText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
  },
  legal: {
    fontSize: 12,
    lineHeight: 18.6,
    paddingHorizontal: 4,
  },
})
