import { Text } from 'react-native'
import { Link, Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Không tìm thấy' }} />
      <SafeAreaView className="flex-1 bg-neu-bg dark:bg-neu-d-bg items-center justify-center gap-4">
        <Text className="text-text-dark dark:text-text-dark-d text-2xl font-display">
          404
        </Text>
        <Text className="text-text-mid dark:text-text-mid-d font-body">
          Trang này không tồn tại.
        </Text>
        <Link href="/" className="text-accent font-body">
          Về trang chủ
        </Link>
      </SafeAreaView>
    </>
  )
}
