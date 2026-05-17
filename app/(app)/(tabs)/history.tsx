import { useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { useStore } from '@/stores'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { useHistory } from '@/hooks/useHistory'
import { useRefresh } from '@/hooks/useRefresh'
import { FlameView } from '@/components/ui/FlameView'

const DAY_LABEL = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Hôm nay'
  if (diff === 1) return 'Hôm qua'
  if (diff < 7) return `${diff} ngày trước`
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })
}

export default function HistoryScreen() {
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const { shadow } = useNeumorphic()

  const { c } = useTheme()
  const { tasks, completions, isLoading, refetch } = useHistory(activeSpaceId)

  useFocusEffect(useCallback(() => { refetch() }, [refetch]))

  const { refreshing, handleRefresh } = useRefresh(refetch)

  const grouped = completions.reduce<Record<string, typeof completions>>((acc, c) => {
    const key = new Date(c.completed_at).toDateString()
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  const days = Object.entries(grouped).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())

  const activeKeySet = new Set(
    completions
      .filter((c) => !c.is_skipped)
      .map((c) => new Date(c.completed_at).toDateString()),
  )
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  if (!activeKeySet.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1)
  }
  while (activeKeySet.has(cursor.toDateString())) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return (
    <SafeAreaView className="flex-1 bg-neu-bg dark:bg-neu-d-bg">
      <ScrollView
        contentContainerClassName="p-4 pb-28"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.accent} />}
      >
        <Text className="text-[26px] font-bold tracking-tight text-text-dark dark:text-text-dark-d">
          Lịch sử 7 ngày
        </Text>
        <Text className="text-[13px] mt-1 mb-[18px] text-text-mid dark:text-text-mid-d">
          Ai làm gì, lúc mấy giờ.
        </Text>

        <View
          className="rounded-[28px] p-[18px] flex-row items-center gap-[14px] mb-[22px] bg-neu-bg dark:bg-neu-d-bg"
          style={shadow('raised', 'md')}
        >
          <FlameView size={56} />
          <View className="flex-1">
            <Text className="text-[13px] text-text-mid dark:text-text-mid-d">Cả Space đang giữ</Text>
            <Text className="text-[20px] font-extrabold tracking-tight text-text-dark dark:text-text-dark-d">
              {streak} ngày streak{' '}
              <Text className="text-[13px] font-medium text-text-mid dark:text-text-mid-d">· liên tiếp</Text>
            </Text>
          </View>
        </View>

        {!isLoading && days.map(([dateKey, items]) => {
          const d = new Date(dateKey)
          return (
            <View key={dateKey} className="mb-4">
              <View className="flex-row items-center gap-[10px] mb-[10px]">
                <View
                  className="w-[38px] h-[38px] rounded-xl items-center justify-center bg-neu-bg dark:bg-neu-d-bg"
                  style={shadow('inset', 'sm')}
                >
                  <Text className="text-[11px] font-bold tracking-[0.4px] text-text-mid dark:text-text-mid-d">
                    {DAY_LABEL[d.getDay()]}
                  </Text>
                </View>
                <View>
                  <Text className="text-[14px] font-bold text-text-dark dark:text-text-dark-d">
                    {getDayLabel(dateKey)}
                  </Text>
                  <Text className="text-[11px] text-text-mid dark:text-text-mid-d">
                    {items.length} hoạt động
                  </Text>
                </View>
              </View>

              <View className="relative ml-[9px]">
                <View className="absolute left-[9px] -top-[10px] -bottom-[10px] w-[2px] rounded-sm bg-neu-bg2 dark:bg-neu-d-bg2" />
                <View className="gap-2 ml-[14px]">
                  {items.map((item) => {
                    const task = tasks.find((t) => t.id === item.task_id)
                    return (
                      <View
                        key={item.id}
                        className="flex-row items-center gap-[10px] p-[10px] px-[14px] rounded-2xl bg-neu-bg dark:bg-neu-d-bg"
                        style={shadow('raised', 'sm')}
                      >
                        <View
                          className="w-8 h-8 rounded-[10px] items-center justify-center bg-neu-bg dark:bg-neu-d-bg"
                          style={shadow('inset', 'sm')}
                        >
                          <Text className="text-base">{task?.icon ?? '📋'}</Text>
                        </View>
                        <View className="flex-1 min-w-0">
                          <Text className="text-[13px] font-semibold text-text-dark dark:text-text-dark-d" numberOfLines={1}>
                            {task?.name ?? 'Task'}
                          </Text>
                          <Text className="text-[11px] text-text-mid dark:text-text-mid-d">
                            {new Date(item.completed_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            {item.is_skipped && ' · Bỏ qua'}
                          </Text>
                        </View>
                        <View
                          className="w-[22px] h-[22px] rounded-full items-center justify-center"
                          style={[
                            { backgroundColor: item.is_skipped ? c.textLight : c.accent },
                            shadow('accent', 'sm'),
                          ]}
                        >
                          <Text className="text-white text-[9px] font-bold">
                            {item.is_skipped ? '–' : '✓'}
                          </Text>
                        </View>
                      </View>
                    )
                  })}
                </View>
              </View>
            </View>
          )
        })}

        {!isLoading && days.length === 0 && (
          <Text className="text-center mt-10 text-sm text-text-light dark:text-text-light-d">
            Chưa có hoạt động nào.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
