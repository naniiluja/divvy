import { useRef, useCallback } from 'react'
import { Animated } from 'react-native'
import { useFocusEffect } from 'expo-router'

export function useTabEnter() {
  const anim = useRef(new Animated.Value(1)).current

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] })
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] })

  useFocusEffect(
    useCallback(() => {
      anim.setValue(0)
      Animated.timing(anim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start()
    }, [anim]),
  )

  return { translateY, opacity }
}
