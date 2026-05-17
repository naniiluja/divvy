import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NHeader } from '@/components/ui/NHeader'
import { JoinSpaceBody } from '@/components/space/JoinSpaceBody'
import { useTheme } from '@/hooks/useTheme'

export default function JoinSpaceAppScreen() {
  const router = useRouter()
  const { c } = useTheme()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <NHeader step={0} total={0} onBack={() => router.back()} />
      </View>
      <JoinSpaceBody
        onSuccess={() => router.replace('/(app)/(tabs)/' as never)}
      />
    </SafeAreaView>
  )
}
