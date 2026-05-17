import { useCallback, useRef, useState } from 'react'
import { View, Text, Pressable, ScrollView, Animated, RefreshControl } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useStore } from '@/stores'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { useMembers } from '@/hooks/useMembers'
import { useTabEnter } from '@/hooks/useTabEnter'
import { useRefresh } from '@/hooks/useRefresh'
import { AnimatedBar } from '@/components/ui/AnimatedBar'

export default function MembersScreen() {
  const router = useRouter()
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const { shadow } = useNeumorphic()
  const { c } = useTheme()

  const { space, members, memberStats, isLoading, refetch } = useMembers(activeSpaceId)
  const enter = useTabEnter()
  const [focusKey, setFocusKey] = useState(0)
  const isMounted = useRef(false)

  useFocusEffect(useCallback(() => {
    refetch()
    if (isMounted.current) setFocusKey((n) => n + 1)
    isMounted.current = true
  }, []))

  const { refreshing, handleRefresh } = useRefresh(() => {
    refetch()
    setFocusKey((n) => n + 1)
  })

  return (
    <SafeAreaView className="flex-1 bg-neu-bg dark:bg-neu-d-bg">
      <ScrollView
        contentContainerClassName="p-4 pb-28 gap-0"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.accent} />}
      >
        <Animated.View style={{ transform: [{ translateY: enter.translateY }], opacity: enter.opacity }}>
        <View className="flex-row items-end justify-between mb-[18px]">
          <View>
            <Text className="text-[26px] font-bold tracking-tight text-text-dark dark:text-text-dark-d">
              Thành viên
            </Text>
            <Text className="text-[13px] mt-1 text-text-mid dark:text-text-mid-d">
              {members.length} người trong "{space?.name ?? '…'}"
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Mời thành viên mới"
            onPress={() => activeSpaceId && router.push(`/(app)/space/invite/${activeSpaceId}` as never)}
            className="px-[14px] py-2 rounded-full"
            style={[{ backgroundColor: c.accent }, shadow('accent', 'sm')]}
          >
            <Text className="text-[12px] font-bold text-white">+ Mời</Text>
          </Pressable>
        </View>

        {!isLoading && (
          <View
            className="rounded-[28px] p-[18px] mb-[18px] bg-neu-bg dark:bg-neu-d-bg"
            style={shadow('raised', 'md')}
          >
            <View className="flex-row items-center justify-between mb-[14px]">
              <Text className="text-[11px] font-bold tracking-widest text-text-mid dark:text-text-mid-d">
                TUẦN NÀY
              </Text>
              <Text className="text-[11px] text-text-light dark:text-text-light-d">
                Task đã hoàn thành
              </Text>
            </View>
            {memberStats.map((m, i) => (
              <View key={m.user_id} className={`flex-row items-center gap-[10px]${i === 0 ? '' : ' mt-3'}`}>
                <View
                  className="w-8 h-8 rounded-full items-center justify-center bg-neu-bg dark:bg-neu-d-bg"
                  style={shadow('inset', 'sm')}
                >
                  <Text className="text-[15px]">{m.emoji}</Text>
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-[13px] font-semibold mb-1 text-text-dark dark:text-text-dark-d" numberOfLines={1}>
                    {m.displayName}
                    {m.role === 'owner' && (
                      <Text className="font-medium text-[11px] text-text-mid dark:text-text-mid-d"> · owner</Text>
                    )}
                  </Text>
                  <AnimatedBar
                    pct={m.totalToday ? Math.min((m.doneToday / m.totalToday) * 100, 100) : 0}
                    color={i === 0 ? c.accent : c.textLight}
                    focusKey={focusKey}
                  />
                </View>
                <Text className="text-[13px] font-extrabold min-w-[36px] text-right tracking-tight text-text-dark dark:text-text-dark-d">
                  {m.doneToday}<Text className="text-[11px] font-medium text-text-light dark:text-text-light-d">/{m.totalToday}</Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text className="text-[11px] font-bold tracking-widest mb-[10px] px-[6px] text-text-mid dark:text-text-mid-d">
          TẤT CẢ ({members.length})
        </Text>
        <View className="gap-[10px]">
          {memberStats.map((m) => (
            <View
              key={m.user_id}
              className="flex-row items-center gap-3 p-[14px] px-4 rounded-[22px] bg-neu-bg dark:bg-neu-d-bg"
              style={shadow('raised', 'sm')}
            >
              <View className="relative">
                <View
                  className="w-[50px] h-[50px] rounded-full items-center justify-center bg-neu-bg dark:bg-neu-d-bg"
                  style={shadow('raised', 'sm')}
                >
                  <Text className="text-2xl">{m.emoji}</Text>
                </View>
                <View className="absolute -right-0.5 -bottom-0.5 w-[14px] h-[14px] rounded-full bg-green-400 border-[2.5px] border-neu-bg dark:border-neu-d-bg" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-[15px] font-bold tracking-tight text-text-dark dark:text-text-dark-d" numberOfLines={1}>
                  {m.displayName}
                  {m.role === 'owner' && (
                    <Text style={{ color: c.accent }} className="text-[11px] font-semibold"> · owner</Text>
                  )}
                </Text>
                <Text className="text-[11px] mt-0.5 text-text-mid dark:text-text-mid-d">
                  {m.doneToday}/{m.totalToday} task hôm nay
                </Text>
              </View>
            </View>
          ))}
          <Pressable
            accessibilityLabel="Mời người mới vào space"
            onPress={() => activeSpaceId && router.push(`/(app)/space/invite/${activeSpaceId}` as never)}
            className="py-[18px] items-center justify-center rounded-[22px] border-2 border-dashed border-text-light dark:border-text-light-d"
          >
            <Text className="text-[13px] font-semibold text-text-mid dark:text-text-mid-d">
              + Mời người mới
            </Text>
          </Pressable>
        </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}
