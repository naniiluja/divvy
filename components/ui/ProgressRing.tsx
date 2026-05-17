import { View, Text, StyleSheet } from 'react-native'
import type { FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import Svg, { Circle } from 'react-native-svg'
import { useTheme } from '@/hooks/useTheme'

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
  const { c } = useTheme()
  const stroke = color ?? c.accent

  const [displayPct, setDisplayPct] = useState(pct)
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentRef = useRef(pct)

  useEffect(() => {
    const target = Math.max(0, Math.min(100, pct))
    const start = currentRef.current
    const diff = target - start
    if (diff === 0) return

    const duration = 400
    const startTime = Date.now()
    let cancelled = false

    const tick = () => {
      if (cancelled) return
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = Math.round(start + diff * eased)
      currentRef.current = value
      setDisplayPct(value)
      if (progress < 1) {
        animRef.current = setTimeout(tick, 16)
      }
    }

    animRef.current = setTimeout(tick, 16)
    return () => {
      cancelled = true
      if (animRef.current) clearTimeout(animRef.current)
    }
  }, [pct])

  const r = (size - strokeWidth * 2) / 2
  const C = 2 * Math.PI * r
  const dash = (Math.max(0, Math.min(100, displayPct)) / 100) * C

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
          {displayPct}
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
