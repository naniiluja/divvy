import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="space-type" />
      <Stack.Screen name="create-space" />
      <Stack.Screen name="join-space" />
      <Stack.Screen name="ai-prompt" />
      <Stack.Screen name="ai-review" />
      <Stack.Screen name="notif-permission" />
      <Stack.Screen name="done" />
    </Stack>
  )
}
