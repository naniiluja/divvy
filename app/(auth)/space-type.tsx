import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NButton } from '@/components/ui/NButton'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'

interface SpaceOption {
  id: string
  emoji: string
  label: string
}

const SPACE_OPTIONS: SpaceOption[] = [
  { id: 'home', emoji: '🏠', label: 'Nhà mình' },
  { id: 'pet', emoji: '🐶', label: 'Thú cưng' },
  { id: 'group', emoji: '🌿', label: 'Nhóm bạn' },
  { id: 'other', emoji: '✨', label: 'Khác' },
]

export default function SpaceTypeScreen() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  const raisedCard = shadow('raised', 'md')
  const insetCard = shadow('inset', 'sm')
  const raisedEmoji = shadow('raised', 'sm')
  const insetEmoji = shadow('inset', 'sm')

  const handleContinue = () => {
    if (!selected) return
    router.push({ pathname: '/(auth)/create-space', params: { type: selected } })
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.textDark }]}>Loại Space của bạn?</Text>
          <Text style={[styles.subtitle, { color: c.textMid }]}>
            Chọn loại không gian phù hợp với nhóm của bạn.
          </Text>
        </View>

        {/* Option cards */}
        <View style={styles.grid}>
          {SPACE_OPTIONS.map((option) => {
            const isActive = selected === option.id
            const cardShadow = isActive ? insetCard : raisedCard
            const emojiShadow = isActive ? raisedEmoji : insetEmoji

            return (
              <Pressable
                key={option.id}
                onPress={() => setSelected(option.id)}
                style={[
                  styles.card,
                  {
                    backgroundColor: c.bg,
                    ...cardShadow,
                  },
                ]}
              >
                {/* Accent dot for active */}
                {isActive && (
                  <View style={[styles.accentDot, { backgroundColor: c.accent }]} />
                )}

                <View
                  style={[
                    styles.emojiCircle,
                    {
                      backgroundColor: c.bg,
                      ...emojiShadow,
                    },
                  ]}
                >
                  <Text style={styles.emojiText}>{option.emoji}</Text>
                </View>

                <Text
                  style={[
                    styles.cardLabel,
                    { color: isActive ? c.textDark : c.textMid },
                    isActive && styles.cardLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* CTA */}
        <NButton
          label="Tiếp tục →"
          onPress={handleContinue}
          isDisabled={!selected}
          fullWidth
        />

        {/* Join existing */}
        <Pressable
          onPress={() => router.push('/(auth)/create-space')}
          style={styles.joinBtn}
        >
          <Text style={[styles.joinText, { color: c.textMid }]}>
            Hoặc tham gia Space có sẵn →
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 28,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.035 * 28,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 15 * 1.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    width: '46%',
    borderRadius: RADIUS.card,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    position: 'relative',
  },
  accentDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: RADIUS.avatar,
  },
  emojiCircle: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 28,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  cardLabelActive: {
    fontWeight: '700',
  },
  joinBtn: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  joinText: {
    fontSize: 14,
    fontWeight: '500',
  },
})
