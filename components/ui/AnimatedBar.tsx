import { useEffect, useRef, useState } from 'react'
import { View, Animated } from 'react-native'

interface AnimatedBarProps {
  pct: number
  color: string
  focusKey?: number
}

export function AnimatedBar({ pct, color, focusKey = 0 }: AnimatedBarProps) {
  const [containerWidth, setContainerWidth] = useState(0)
  const anim = useRef(new Animated.Value(0)).current
  const prevFocusKey = useRef(focusKey)

  useEffect(() => {
    if (containerWidth === 0) return
    const isReset = focusKey !== prevFocusKey.current
    prevFocusKey.current = focusKey
    if (isReset) anim.setValue(0)
    Animated.timing(anim, {
      toValue: pct / 100,
      duration: isReset ? 520 : 400,
      delay: isReset ? 100 : 0,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      useNativeDriver: false,
    }).start()
  }, [pct, focusKey, containerWidth])

  const animatedWidth = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, containerWidth],
  })

  return (
    <View
      style={{ flex: 1, height: 8, borderRadius: 999, overflow: 'hidden' }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: animatedWidth,
          borderRadius: 999,
          backgroundColor: color,
        }}
      />
    </View>
  )
}
