import { useState } from 'react'
import { View, Text, Pressable, TextInput, Alert, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import { NButton } from '@/components/ui/NButton'
import { NHeader } from '@/components/ui/NHeader'
import { supabase } from '@/lib/supabase'

type Method = 'phone' | 'email'

export default function SignInScreen() {
  const router = useRouter()
  const [method, setMethod] = useState<Method>('phone')
  const [value, setValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const valid = method === 'phone'
    ? value.replace(/\D/g, '').length >= 9
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleContinue = async () => {
    setIsLoading(true)
    try {
      if (method === 'phone') {
        const { error } = await supabase.auth.signInWithOtp({ phone: value.trim() })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email: value.trim() })
        if (error) throw error
      }
      router.push({ pathname: '/(auth)/otp', params: { method, value: value.trim() } })
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Đã có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.content}>
        <NHeader step={1} total={5} onBack={() => router.replace('/(auth)/welcome')} />

        <View style={styles.headingBlock}>
          <Text style={[styles.title, { color: c.textDark }]}>Chào bạn 👋</Text>
          <Text style={[styles.subtitle, { color: c.textMid }]}>
            {method === 'phone'
              ? 'Nhập số điện thoại để nhận mã OTP.'
              : 'Nhập email để nhận magic link.'}
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          {/* Segmented toggle */}
          <View style={[styles.toggle, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
            <View style={[
              styles.togglePill,
              {
                backgroundColor: c.bg,
                left: method === 'phone' ? 5 : '50%',
                ...shadow('raised', 'sm'),
              },
            ]} />
            {(['phone', 'email'] as Method[]).map(m => (
              <Pressable
                key={m}
                onPress={() => { setMethod(m); setValue('') }}
                style={styles.toggleOption}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: method === m ? c.accent : c.textMid }}>
                  {m === 'phone' ? '📱 Phone' : '✉️ Email'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Phone input */}
          {method === 'phone' ? (
            <View style={[styles.phoneInput, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
              <Text style={{ fontSize: 22 }}>🇻🇳</Text>
              <Text style={[styles.countryCode, { color: c.textDark }]}>+84</Text>
              <View style={[styles.divider, { backgroundColor: c.textLight }]} />
              <TextInput
                value={value}
                onChangeText={t => setValue(t.replace(/[^\d ]/g, ''))}
                placeholder="912 345 678"
                placeholderTextColor={c.textLight}
                keyboardType="phone-pad"
                style={[styles.phoneInputText, { color: c.textDark }]}
                autoFocus
              />
            </View>
          ) : (
            <View style={[styles.emailInput, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
              <TextInput
                value={value}
                onChangeText={setValue}
                placeholder="ban@email.com"
                placeholderTextColor={c.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.emailInputText, { color: c.textDark }]}
                autoFocus
              />
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
          label={`Gửi mã →`}
          onPress={handleContinue}
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
  subtitle: {
    fontSize: 15,
    lineHeight: 22.5,
  },
  toggle: {
    height: 52,
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    padding: 5,
    position: 'relative',
  },
  togglePill: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    width: '47%',
    borderRadius: RADIUS.pill,
  },
  toggleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  phoneInput: {
    height: 60,
    borderRadius: RADIUS.input,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 22,
    paddingRight: 6,
    gap: 10,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 28,
    opacity: 0.4,
  },
  phoneInputText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.04 * 18,
  },
  emailInput: {
    height: 60,
    borderRadius: RADIUS.input,
    paddingHorizontal: 22,
    justifyContent: 'center',
  },
  emailInputText: {
    fontSize: 17,
    fontWeight: '500',
  },
  legal: {
    fontSize: 12,
    lineHeight: 18.6,
    paddingHorizontal: 4,
  },
})
