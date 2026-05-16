import { useState, useRef } from 'react'
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { NButton } from '@/components/ui/NButton'
import { NHeader } from '@/components/ui/NHeader'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK } from '@/constants/theme'
import { supabase } from '@/lib/supabase'

export default function OtpScreen() {
  const router = useRouter()
  const { method, value } = useLocalSearchParams<{ method: 'phone' | 'email'; value: string }>()
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const [digits, setDigits] = useState<string[]>(['', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const inputRefs = useRef<(TextInput | null)[]>([null, null, null, null])

  const handleDigit = (text: string, i: number) => {
    const d = text.replace(/[^0-9]/g, '').slice(-1)
    const next = [...digits]
    next[i] = d
    setDigits(next)
    if (d && i < 3) inputRefs.current[i + 1]?.focus()
  }

  const handleKey = (key: string, i: number) => {
    if (key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  const isComplete = digits.every(d => d !== '')

  const handleVerify = async () => {
    setIsLoading(true)
    try {
      const otp = digits.join('')
      const { error } = method === 'phone'
        ? await supabase.auth.verifyOtp({ phone: value, token: otp, type: 'sms' })
        : await supabase.auth.verifyOtp({ email: value, token: otp, type: 'email' })
      if (error) throw error
      router.replace('/(auth)/profile-setup')
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Mã OTP không hợp lệ')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      if (method === 'phone') {
        await supabase.auth.signInWithOtp({ phone: value })
      } else {
        await supabase.auth.signInWithOtp({ email: value })
      }
      Alert.alert('Đã gửi lại', 'Kiểm tra tin nhắn của bạn.')
    } catch {
      Alert.alert('Lỗi', 'Không thể gửi lại.')
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.content}>
        <NHeader step={2} total={5} onBack={() => router.replace('/(auth)/sign-in')} />

        <View style={styles.headingBlock}>
          <Text style={[styles.title, { color: c.textDark }]}>Nhập mã 4 số</Text>
          <Text style={[styles.subtitle, { color: c.textMid }]}>
            Đã gửi đến{' '}
            <Text style={{ color: c.textDark, fontWeight: '700' }}>
              {method === 'phone' ? `+84 ${value}` : value}
            </Text>
            {'. Mã hết hạn sau '}
            <Text style={{ color: c.accent, fontWeight: '600' }}>02:48</Text>.
          </Text>
        </View>

        {/* 4 OTP boxes */}
        <View style={styles.otpRow}>
          {digits.map((digit, i) => (
            <View
              key={`otp-${i}`}
              style={[
                styles.otpBox,
                {
                  backgroundColor: c.bg,
                  ...(digit ? shadow('raised', 'sm') : shadow('inset', 'sm')),
                },
              ]}
            >
              <TextInput
                ref={ref => { inputRefs.current[i] = ref }}
                value={digit}
                onChangeText={t => handleDigit(t, i)}
                onKeyPress={({ nativeEvent }) => handleKey(nativeEvent.key, i)}
                maxLength={1}
                keyboardType="number-pad"
                selectTextOnFocus
                autoFocus={i === 0}
                style={[styles.otpInput, { color: c.textDark }]}
              />
            </View>
          ))}
        </View>

        {/* Resend */}
        <View style={styles.resendRow}>
          <Text style={[{ fontSize: 14, color: c.textMid }]}>Chưa nhận được? </Text>
          <Pressable onPress={handleResend} style={styles.resendBtn}>
            <Text style={[styles.resendText, { color: c.accent }]}>Gửi lại</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />

        <NButton
          label="Xác nhận"
          onPress={handleVerify}
          isLoading={isLoading}
          isDisabled={!isComplete}
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
  otpRow: {
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  otpBox: {
    flex: 1,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpInput: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    height: '100%',
    letterSpacing: -0.02 * 32,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  resendText: { fontSize: 14, fontWeight: '600' },
})
