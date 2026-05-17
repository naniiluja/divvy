import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NHeader } from '@/components/ui/NHeader'
import { JoinSpaceBody } from '@/components/space/JoinSpaceBody'
import { useTheme } from '@/hooks/useTheme'

export default function JoinSpaceAuthScreen() {
  const router = useRouter()
  const { c } = useTheme()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <NHeader step={4} total={5} onBack={() => router.replace('/(auth)/space-type')} />
      </View>
      <JoinSpaceBody
        onSuccess={(space) =>
          router.replace({
            pathname: '/(auth)/ai-prompt',
            params: { spaceId: space.id, spaceName: space.name },
          })
        }
      />
    </SafeAreaView>
  )
}
