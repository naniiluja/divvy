import { Pressable, View, StyleSheet } from 'react-native'
import type { FC } from 'react'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK } from '@/constants/theme'

interface NToggleProps {
  value: boolean
  onToggle: () => void
  accessibilityLabel?: string
}

export const NToggle: FC<NToggleProps> = ({ value, onToggle, accessibilityLabel }) => {
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  return (
    <Pressable
      onPress={onToggle}
      style={[styles.track, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
    >
      <View
        style={[
          styles.thumb,
          { left: value ? 22 : 3 },
          value
            ? { backgroundColor: c.accent, ...shadow('accent', 'sm') }
            : { backgroundColor: c.bg, ...shadow('raised', 'sm') },
        ]}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 999,
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    top: 3,
  },
})
