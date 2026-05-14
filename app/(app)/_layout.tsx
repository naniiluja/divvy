import { View, ActivityIndicator } from 'react-native'
import { Redirect, Stack } from 'expo-router'
import { useSession } from '@/hooks/useSession'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function AppLayout() {
  const { session, isLoading } = useSession()
  usePushNotifications()

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
      <Stack.Screen name="task/ai-generate" />
      <Stack.Screen name="space/join" />
      <Stack.Screen name="notifications" />
    </Stack>
  )
}
