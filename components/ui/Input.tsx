import { View, TextInput, Text } from 'react-native'
import type { FC } from 'react'
import type { TextInputProps } from 'react-native'
import { useTheme } from '@/hooks/useTheme'

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string
  error?: string
  onChangeText: (text: string) => void
}

export const Input: FC<InputProps> = ({
  label,
  error,
  onChangeText,
  ...rest
}) => {
  const { colors: themeColors } = useTheme()

  return (
    <View className="gap-2">
      {label ? (
        <Text className="text-text-mid dark:text-text-mid-d text-sm font-body">
          {label}
        </Text>
      ) : null}
      <View
        className={[
          'rounded-input px-4',
          'min-h-[60px] justify-center',
          'bg-neu-bg2 dark:bg-neu-d-bg2',
          'border',
          error
            ? 'border-danger'
            : 'border-neu-dark/30 dark:border-neu-d-dark/30',
        ].join(' ')}
      >
        <TextInput
          onChangeText={onChangeText}
          placeholderTextColor={themeColors.textLight}
          className="text-text-dark dark:text-text-dark-d text-base font-body"
          {...rest}
        />
      </View>
      {error ? (
        <Text className="text-danger text-xs font-body">{error}</Text>
      ) : null}
    </View>
  )
}
