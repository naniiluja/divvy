import { View, TextInput, Text, StyleSheet } from 'react-native'
import type { FC } from 'react'
import type { TextInputProps } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'

interface NInputProps extends Omit<TextInputProps, 'style'> {
  label?: string
  error?: string
  onChangeText: (text: string) => void
}

export const NInput: FC<NInputProps> = ({
  label,
  error,
  onChangeText,
  ...rest
}) => {
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: c.textMid }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: c.bg,
            borderColor: error
              ? '#EF4444'
              : isDark
              ? 'rgba(73,82,110,0.3)'
              : 'rgba(163,177,198,0.4)',
          },
        ]}
      >
        <TextInput
          onChangeText={onChangeText}
          placeholderTextColor={c.textLight}
          style={[styles.input, { color: c.textDark }]}
          {...rest}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    height: 60,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    fontSize: 17,
    fontWeight: '500',
  },
  error: {
    fontSize: 12,
    color: '#EF4444',
  },
})
