import { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { EmptyState } from '@/components/layout/EmptyState'
import { TaskCardSkeleton } from '@/components/ui/Skeleton'
import { useStore } from '@/stores'
import { getSpacesForUser } from '@/lib/api'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import type { Space } from '@/types'

export default function SpacesScreen() {
  const router = useRouter()
  const userId = useStore((s) => s.user?.id)
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const setActiveSpaceId = useStore((s) => s.setActiveSpaceId)

  const [spaces, setSpaces] = useState<Space[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  useEffect(() => {
    if (!userId) return
    setIsLoading(true)
    getSpacesForUser(userId)
      .then(setSpaces)
      .finally(() => setIsLoading(false))
  }, [userId])

  const handleSelectSpace = (spaceId: string) => {
    setActiveSpaceId(spaceId)
    router.push(`/(app)/space/${spaceId}` as never)
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenHeader
          title="Spaces"
          rightAction={{ label: '+ Tạo', onPress: () => router.push('/(app)/space/new') }}
        />
        <View style={styles.list}>
          {[1, 2, 3].map((i) => <TaskCardSkeleton key={i} />)}
        </View>
      </SafeAreaView>
    )
  }

  if (spaces.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-neu-bg dark:bg-neu-d-bg">
        <ScreenHeader
          title="Spaces"
          rightAction={{ label: '+ Tạo', onPress: () => router.push('/(app)/space/new') }}
        />
        <EmptyState
          emoji="🏘️"
          title="Chưa có Space nào"
          description="Tạo Space để bắt đầu. Mời thành viên qua link."
          actionLabel="Tạo Space"
          onAction={() => router.push('/(app)/space/new')}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader
        title="Spaces"
        rightAction={{ label: '+ Tạo', onPress: () => router.push('/(app)/space/new') }}
      />
      <FlashList
        data={spaces}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isActive = item.id === activeSpaceId
          return (
            <Pressable
              onPress={() => handleSelectSpace(item.id)}
              accessibilityLabel={`Chọn Space ${item.name}`}
              accessibilityRole="button"
              style={[
                styles.card,
                { backgroundColor: c.bg },
                isActive ? shadow('accent', 'md') : shadow('raised', 'md'),
              ]}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <View style={styles.info}>
                <Text style={[styles.name, { color: c.textDark }]}>{item.name}</Text>
              </View>
              {isActive && (
                <View style={[styles.activeDot, { backgroundColor: c.accent }]} />
              )}
            </Pressable>
          )
        }}
      />
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.card,
    padding: 18,
    gap: 14,
  },
  emoji: { fontSize: 32 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontWeight: '600' },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
})
