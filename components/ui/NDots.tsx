import { View, StyleSheet } from 'react-native'
import type { FC } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'

interface NDotsProps {
  count: number
  activeIndex: number
}

export const NDots: FC<NDotsProps> = ({ count, activeIndex }) => {
  const { isDark } = useTheme()
  const { shadow } = useNeumorphic()
  const c = isDark ? DARK : LIGHT

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.bg,
          ...shadow('inset', 'sm'),
        },
      ]}
    >
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={`dot-${index}`}
          style={[
            styles.dot,
            index === activeIndex
              ? { width: 22, backgroundColor: c.accent }
              : {
                  width: 8,
                  backgroundColor: isDark
                    ? 'rgba(73,82,110,0.6)'
                    : 'rgba(163,177,198,0.6)',
                  opacity: 0.4,
                },
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    alignSelf: 'center',
  },
  dot: {
    height: 8,
    borderRadius: RADIUS.pill,
  },
})
