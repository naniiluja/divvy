import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/stores'

export function usePushNotifications() {
  const userId = useStore((s) => s.user?.id)

  useEffect(() => {
    if (!userId || !Device.isDevice) return
    registerForPushNotifications(userId)
  }, [userId])
}

async function registerForPushNotifications(userId: string) {
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
}
