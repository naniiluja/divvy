import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'

export default function NotificationsScreen() {
  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: c.textDark }]}>Thông báo</Text>
        <Text style={[styles.subtitle, { color: c.textMid }]}>Cập nhật từ Spaces của bạn.</Text>

        <View style={[styles.emptyCard, { backgroundColor: c.bg, ...shadow('raised', 'md') }]}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={[styles.emptyTitle, { color: c.textDark }]}>Không có thông báo nào.</Text>
          <Text style={[styles.emptySub, { color: c.textMid }]}>
            Thông báo về task, streak và hoạt động của Space sẽ hiện ở đây.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 120 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.65 },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 24 },
  emptyCard: {
    borderRadius: RADIUS.card,
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.4 },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
})
