import { View, Text, StyleSheet } from 'react-native'
import type { FC } from 'react'
import Svg, { Circle } from 'react-native-svg'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK } from '@/constants/theme'

interface ProgressRingProps {
  pct: number
  size?: number
  strokeWidth?: number
  color?: string
  showLabel?: boolean
}

export const ProgressRing: FC<ProgressRingProps> = ({
  pct,
  size = 50,
  strokeWidth = 3,
  color,
  showLabel = true,
}) => {
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT
  const stroke = color ?? c.accent

  const r = (size - strokeWidth * 2) / 2
  const C = 2 * Math.PI * r
  const dash = (Math.max(0, Math.min(100, pct)) / 100) * C

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.absolute}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {showLabel && (
        <Text style={[styles.pct, { color: c.textDark, fontSize: Math.round(size * 0.24) }]}>
          {pct}
          <Text style={[styles.pctSmall, { fontSize: Math.round(size * 0.16) }]}>%</Text>
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  absolute: { position: 'absolute' },
  pct: { fontWeight: '700', letterSpacing: -0.3 },
  pctSmall: { fontWeight: '700' },
})
