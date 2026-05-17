import { View, TextInput, Text } from 'react-native'
import type { FC } from 'react'
import type { TextInputProps } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { RADIUS } from '@/constants/theme'

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
  const { isDark, c } = useTheme()

  return (
    <View className="gap-2">
      {label ? (
        <Text className="text-sm font-medium" style={{ color: c.textMid }}>{label}</Text>
      ) : null}
      <View
        className="h-[60px] border justify-center px-4"
        style={{
          backgroundColor: c.bg,
          borderColor: error ? c.error : isDark ? 'rgba(73,82,110,0.3)' : 'rgba(163,177,198,0.4)',
          borderRadius: RADIUS.input,
        }}
      >
        <TextInput
          onChangeText={onChangeText}
          placeholderTextColor={c.textLight}
          style={{ fontSize: 17, fontWeight: '500', color: c.textDark }}
          {...rest}
        />
      </View>
      {error ? (
        <Text className="text-xs" style={{ color: c.error }}>{error}</Text>
      ) : null}
    </View>
  )
}
