import { useState } from 'react'
import { View, Text, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createSpace } from '@/lib/api'
import { useStore } from '@/stores'

export default function NewSpaceScreen() {
  const router = useRouter()
  const user = useStore((s) => s.user)
  const setActiveSpaceId = useStore((s) => s.setActiveSpaceId)
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [nameError, setNameError] = useState<string | undefined>(undefined)

  const handleCreate = async () => {
    if (!name.trim()) {
      setNameError('Vui lòng nhập tên Space')
      return
    }
    if (!user?.id) return

    setIsLoading(true)
    setNameError(undefined)

    try {
      const space = await createSpace(name.trim(), '🏠', user.id)
      setActiveSpaceId(space.id)
      router.replace('/(app)/(tabs)/')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đã có lỗi xảy ra'
      Alert.alert('Lỗi', message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neu-bg dark:bg-neu-d-bg">
      <ScreenHeader title="Tạo Space mới" showBack />
      <View className="flex-1 px-6 gap-6 pt-4">
        <Text className="text-text-mid dark:text-text-mid-d font-body text-base">
          Space là nơi bạn và mọi người chia sẻ công việc cùng nhau.
        </Text>
        <Input
          label="Tên Space"
          value={name}
          onChangeText={setName}
          error={nameError}
          placeholder="Nhà mình, Phòng 302..."
          autoCapitalize="words"
        />
        <View className="mt-auto pb-4">
          <Button
            label="Tạo Space"
            onPress={handleCreate}
            isLoading={isLoading}
            size="lg"
          />
        </View>
      </View>
    </SafeAreaView>
  )
}
