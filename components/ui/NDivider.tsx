import { View, Text, StyleSheet } from 'react-native'
import type { FC } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK } from '@/constants/theme'

interface NDividerProps {
  label?: string
}

export const NDivider: FC<NDividerProps> = ({ label }) => {
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  if (!label) {
    return <View style={[styles.line, { backgroundColor: c.bg2 }]} />
  }

  return (
    <View style={styles.row}>
      <View style={[styles.lineFlex, { backgroundColor: c.bg2 }]} />
      <Text style={[styles.label, { color: c.textLight }]}>{label}</Text>
      <View style={[styles.lineFlex, { backgroundColor: c.bg2 }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  line: {
    height: 1,
    alignSelf: 'stretch',
  },
  lineFlex: {
    flex: 1,
    height: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
})
