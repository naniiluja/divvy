import { AppState } from 'react-native'
import 'react-native-url-polyfill/auto'
import * as SecureStore from 'expo-secure-store'
import { createClient, processLock } from '@supabase/supabase-js'

const CHUNK_SIZE = 1900
const CHUNK_PREFIX = 'supabase_chunk'

const LargeSecureStore = {
  async getItem(key: string): Promise<string | null> {
    const count = await SecureStore.getItemAsync(`${CHUNK_PREFIX}_${key}_count`)
    if (!count) return SecureStore.getItemAsync(key)

    const chunks: string[] = []
    for (let i = 0; i < parseInt(count, 10); i++) {
      const chunk = await SecureStore.getItemAsync(`${CHUNK_PREFIX}_${key}_${i}`)
      if (!chunk) return null
      chunks.push(chunk)
    }
    return chunks.join('')
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(`${CHUNK_PREFIX}_${key}_count`, '')
      await SecureStore.setItemAsync(key, value)
      return
    }
    const chunks = Math.ceil(value.length / CHUNK_SIZE)
    await SecureStore.setItemAsync(`${CHUNK_PREFIX}_${key}_count`, String(chunks))
    for (let i = 0; i < chunks; i++) {
      await SecureStore.setItemAsync(
        `${CHUNK_PREFIX}_${key}_${i}`,
        value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      )
    }
  },

  async removeItem(key: string): Promise<void> {
    const count = await SecureStore.getItemAsync(`${CHUNK_PREFIX}_${key}_count`)
    if (count) {
      for (let i = 0; i < parseInt(count, 10); i++) {
        await SecureStore.deleteItemAsync(`${CHUNK_PREFIX}_${key}_${i}`)
      }
      await SecureStore.deleteItemAsync(`${CHUNK_PREFIX}_${key}_count`)
    }
    await SecureStore.deleteItemAsync(key)
  },
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: LargeSecureStore,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
})

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
