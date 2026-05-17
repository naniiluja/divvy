import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { RADIUS } from '@/constants/theme'
import type { FC } from 'react'

interface NHeaderProps {
  step: number
  total: number
  onBack?: () => void
}

export const NHeader: FC<NHeaderProps> = ({ step, total, onBack }) => {
  const router = useRouter()
  const { shadow } = useNeumorphic()
  const { c } = useTheme()

  const raisedSm = shadow('raised', 'sm')
  const insetSm = shadow('inset', 'sm')

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onBack ?? (() => router.back())}
        style={[styles.backBtn, { backgroundColor: c.bg, ...raisedSm }]}
      >
        <Text style={[styles.backArrow, { color: c.textMid }]}>‹</Text>
      </Pressable>

      {total > 0 ? (
        <View style={[styles.stepPill, { backgroundColor: c.bg, ...insetSm }]}>
          <Text style={[styles.stepText, { color: c.textMid }]}>
            Bước {step}/{total}
          </Text>
        </View>
      ) : (
        <View style={styles.placeholder} />
      )}

      <View style={styles.placeholder} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 26,
    fontWeight: '400',
    lineHeight: 30,
    marginTop: -2,
  },
  stepPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  stepText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1 * 11,
    textTransform: 'uppercase',
  },
  placeholder: {
    width: 44,
  },
})
