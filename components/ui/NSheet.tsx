import { useEffect, useRef } from 'react'
import {
  Modal,
  Pressable,
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native'
import type { FC, ReactNode } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK } from '@/constants/theme'

interface NSheetProps {
  visible: boolean
  onClose: () => void
  children: ReactNode
}

const SH = Dimensions.get('window').height

export const NSheet: FC<NSheetProps> = ({ visible, onClose, children }) => {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const backdrop = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(SH)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 9,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SH,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible, backdrop, translateY])

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', opacity: backdrop }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: c.bg,
              paddingBottom: 32 + insets.bottom,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: c.bg2 }]} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
})
