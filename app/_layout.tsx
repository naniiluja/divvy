import '../global.css'
import { useEffect } from 'react'
import { View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useFonts, PlusJakartaSans_500Medium, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans'
import * as SplashScreen from 'expo-splash-screen'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useColorScheme, vars } from 'nativewind'
import { SWRConfig } from 'swr'
import { useStore } from '@/stores'
import { ACCENT_COLORS } from '@/stores/uiSlice'
import { SWR_CONFIG } from '@/lib/swrConfig'

SplashScreen.preventAutoHideAsync()

function ThemedApp() {
  const themeOverride = useStore((s) => s.themeOverride)
  const accentKey = useStore((s) => s.accentKey)
  const { setColorScheme } = useColorScheme()

  useEffect(() => {
    setColorScheme(themeOverride)
  }, [themeOverride, setColorScheme])

  return (
    <View
      style={[{ flex: 1 }, vars({ '--color-accent': ACCENT_COLORS[accentKey] })]}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </View>
  )
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <SafeAreaProvider>
      <SWRConfig value={SWR_CONFIG}>
        <ThemedApp />
      </SWRConfig>
    </SafeAreaProvider>
  )
}
