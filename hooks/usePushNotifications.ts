import { useEffect } from 'react'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/stores'

const IS_EXPO_GO = Constants.appOwnership === 'expo'

export function usePushNotifications() {
  const userId = useStore((s) => s.user?.id)

  useEffect(() => {
    if (!userId || IS_EXPO_GO) return
    registerForPushNotifications(userId)
  }, [userId])
}

async function registerForPushNotifications(userId: string) {
  try {
    const Device = await import('expo-device')
    const Notifications = await import('expo-notifications')

    if (!Device.default.isDevice) return

    const { status: existing } = await Notifications.getPermissionsAsync()
    let finalStatus = existing
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== 'granted') return

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      })
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data
    await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId)
  } catch {
    // push notifications not available (Expo Go)
  }
}
