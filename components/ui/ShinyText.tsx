import { useEffect, useRef, useState } from 'react'
import { Text, View, StyleSheet } from 'react-native'
import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { StyleProp, TextStyle } from 'react-native'

interface ShinyTextProps {
  text: string
  color?: string
  shineColor?: string
  speed?: number
  style?: StyleProp<TextStyle>
  textStyle?: StyleProp<TextStyle>
}

export function ShinyText({
  text,
  color = '#888888',
  shineColor = '#ffffff',
  speed = 2,
  style,
  textStyle,
}: ShinyTextProps) {
  const [width, setWidth] = useState(0)
  const translateX = useSharedValue(-150)

  useEffect(() => {
    if (width === 0) return
    translateX.value = -(width * 0.4)
    translateX.value = withRepeat(
      withTiming(width, { duration: speed * 1000, easing: Easing.linear }),
      -1,
      false,
    )
  }, [width, speed, translateX])

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  return (
    <MaskedView
      style={style}
      maskElement={
        <Text style={[{ color: '#000' }, textStyle]}>{text}</Text>
      }
    >
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={styles.base}
      >
        <Text style={[{ color }, textStyle, styles.base]}>{text}</Text>

        <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]} pointerEvents="none">
          <LinearGradient
            colors={['transparent', shineColor + '44', shineColor + 'EE', shineColor + '44', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: width * 0.4, height: '100%' }}
          />
        </Animated.View>
      </View>
    </MaskedView>
  )
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
})
