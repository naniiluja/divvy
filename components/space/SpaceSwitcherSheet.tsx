import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import type { FC } from 'react'
import * as Haptics from 'expo-haptics'
import { NSheet } from '@/components/ui/NSheet'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import { useStore } from '@/stores'
import { useSpaceStats } from '@/hooks/useSpaceStats'

interface SpaceSwitcherSheetProps {
  visible: boolean
  onClose: () => void
}

export const SpaceSwitcherSheet: FC<SpaceSwitcherSheetProps> = ({ visible, onClose }) => {
  const router = useRouter()
  const userId = useStore((s) => s.user?.id)
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const setActiveSpaceId = useStore((s) => s.setActiveSpaceId)
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const { stats, isLoading } = useSpaceStats(userId ?? null, visible)

  const handleSelect = (spaceId: string) => {
    if (spaceId === activeSpaceId) {
      onClose()
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setActiveSpaceId(spaceId)
    onClose()
    router.replace('/(app)/(tabs)/' as never)
  }

  return (
    <NSheet visible={visible} onClose={onClose}>
      <Text
        className="text-xl font-bold mb-[14px] px-1"
        style={{ color: c.textDark, letterSpacing: -0.4 }}
      >
        Spaces của bạn
      </Text>

      <ScrollView
        className="max-h-[340px]"
        contentContainerStyle={{ gap: 10, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View className="p-10 items-center">
            <ActivityIndicator color={c.accent} />
          </View>
        ) : (
          stats.map(({ space, memberCount, todoToday }) => {
            const isActive = space.id === activeSpaceId
            return (
              <Pressable
                key={space.id}
                onPress={() => handleSelect(space.id)}
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    paddingHorizontal: 16,
                    borderRadius: 22,
                    backgroundColor: c.bg,
                    ...shadow('raised', 'sm'),
                  },
                ]}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: c.bg,
                    ...shadow('inset', 'sm'),
                  }}
                >
                  <Text className="text-[26px]">{space.emoji}</Text>
                </View>
                <View className="flex-1 min-w-0">
                  <Text
                    className="text-[15px] font-bold"
                    style={{ color: c.textDark, letterSpacing: -0.15 }}
                    numberOfLines={1}
                  >
                    {space.name}
                  </Text>
                  <Text className="text-[11px] mt-0.5" style={{ color: c.textMid }}>
                    {memberCount} người · {todoToday} task hôm nay
                  </Text>
                </View>
                {todoToday > 0 && (
                  <View
                    className="min-w-[22px] h-[22px] rounded-full px-[7px] items-center justify-center"
                    style={{ backgroundColor: c.accent }}
                  >
                    <Text className="text-[11px] font-bold text-white">{todoToday}</Text>
                  </View>
                )}
                {isActive && (
                  <View
                    className="w-2 h-2 rounded-full ml-1"
                    style={{ backgroundColor: c.accent }}
                  />
                )}
              </Pressable>
            )
          })
        )}
      </ScrollView>

      <View className="flex-row gap-[10px] mt-3">
        <Pressable
          onPress={() => { onClose(); router.push('/(app)/space/new') }}
          style={[
            {
              flex: 1,
              height: 48,
              borderRadius: RADIUS.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.bg,
              ...shadow('raised', 'sm'),
            },
          ]}
        >
          <Text className="text-sm font-semibold" style={{ color: c.accent }}>+ Tạo Space</Text>
        </Pressable>
        <Pressable
          onPress={() => { onClose(); router.push('/(app)/space/join') }}
          style={[
            {
              flex: 1,
              height: 48,
              borderRadius: RADIUS.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.bg,
              ...shadow('raised', 'sm'),
            },
          ]}
        >
          <Text className="text-sm font-semibold" style={{ color: c.accent }}>🔗 Tham gia</Text>
        </Pressable>
      </View>
    </NSheet>
  )
}
