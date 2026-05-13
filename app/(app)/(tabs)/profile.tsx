import { View, Text, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/stores'

export default function ProfileScreen() {
  const user = useStore((s) => s.user)
  const clearSession = useStore((s) => s.clearSession)

  const handleSignOut = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut()
            clearSession()
          },
        },
      ],
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-neu-bg dark:bg-neu-d-bg">
      <ScreenHeader title="Hồ sơ" />

      <View className="flex-1 px-6 gap-6">
        {/* User info */}
        <View className="items-center gap-3 py-6">
          <Avatar emoji="🌸" size="lg" />
          <Text className="text-text-dark dark:text-text-dark-d text-xl font-display">
            {user?.email ?? 'Người dùng'}
          </Text>
          <Text className="text-text-mid dark:text-text-mid-d text-sm font-body">
            {user?.phone ?? user?.email ?? ''}
          </Text>
        </View>

        {/* Sign out */}
        <View className="mt-auto pb-4">
          <Button
            label="Đăng xuất"
            onPress={handleSignOut}
            variant="ghost"
            size="md"
          />
        </View>
      </View>
    </SafeAreaView>
  )
}
