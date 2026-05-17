import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import type { FC } from 'react'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { RADIUS } from '@/constants/theme'
import { IconBell, IconChevronRight } from '@/components/ui/NIcons'
import type { Space } from '@/types'

interface SpaceHeaderProps {
  space: Space
  onPressSpace?: () => void
}

export const SpaceHeader: FC<SpaceHeaderProps> = ({ space, onPressSpace }) => {
  const router = useRouter()
  const { shadow } = useNeumorphic()
  const { c } = useTheme()

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPressSpace}
        style={styles.left}
        accessibilityLabel="Đổi Space"
        accessibilityRole="button"
      >
        <View style={[styles.emojiBox, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
          <Text style={styles.emoji}>{space.emoji}</Text>
        </View>
        <Text style={[styles.name, { color: c.textDark }]} numberOfLines={1}>
          {space.name}
        </Text>
        {onPressSpace ? <IconChevronRight size={18} color={c.textMid} /> : null}
      </Pressable>

      <Pressable
        onPress={() => router.push('/(app)/notifications' as never)}
        style={[styles.bellBtn, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}
        accessibilityLabel="Thông báo"
        accessibilityRole="button"
      >
        <IconBell size={20} color={c.textMid} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minHeight: 44,
  },
  emojiBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  name: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.34,
    flexShrink: 1,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
