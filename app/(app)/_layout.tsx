import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Redirect, Stack } from 'expo-router'
import { useSession } from '@/hooks/useSession'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useStore } from '@/stores'
import { getSpacesForUser } from '@/lib/api'

export default function AppLayout() {
  const { session, isLoading } = useSession()
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const setActiveSpaceId = useStore((s) => s.setActiveSpaceId)
  usePushNotifications()

  // Auto-restore activeSpaceId from DB if store is empty after app restart.
  // Zustand persist may not include space slice, so we rehydrate on session ready.
  useEffect(() => {
    if (!session?.user || activeSpaceId) return
    getSpacesForUser(session.user.id)
      .then((spaces) => {
        if (spaces.length > 0) setActiveSpaceId(spaces[0].id)
      })
      .catch(() => {})
  }, [session, activeSpaceId, setActiveSpaceId])

  if (isLoading) {
    return (
      <View className="flex-1 bg-neu-bg dark:bg-neu-d-bg items-center justify-center">
        <ActivityIndicator color="#6C7CFF" size="large" />
      </View>
    )
  }

  if (!session) {
    return <Redirect href="/(auth)/splash" />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="space/new" />
      <Stack.Screen name="space/[id]" />
      <Stack.Screen name="space/invite/[id]" />
      <Stack.Screen name="task/new" />
      <Stack.Screen name="task/[id]" />
      <Stack.Screen name="task/ai-generate" />
      <Stack.Screen name="space/join" />
      <Stack.Screen name="notifications" />
    </Stack>
  )
}
