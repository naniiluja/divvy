import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { NButton } from '@/components/ui/NButton'
import { useStore } from '@/stores'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { LIGHT, DARK, RADIUS } from '@/constants/theme'
import { getSpaceMembers, callGenerateTasks, type GeneratedTask } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { SpaceMember } from '@/types'

type Frequency = 'daily' | 'weekly' | '3x_week'

const FREQ_LABELS: Record<Frequency, string> = {
  daily: 'Hằng ngày',
  weekly: 'Tuần',
  '3x_week': '3x/tuần',
}

export default function AIGenerateScreen() {
  const router = useRouter()
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const userId = useStore((s) => s.user?.id)

  const [prompt, setPrompt] = useState('')
  const [members, setMembers] = useState<SpaceMember[]>([])
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const { shadow } = useNeumorphic()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT

  useEffect(() => {
    if (!activeSpaceId) return
    getSpaceMembers(activeSpaceId).then(setMembers)
  }, [activeSpaceId])

  const handleGenerate = async () => {
    if (!prompt.trim() || !activeSpaceId) return
    setIsGenerating(true)
    setGeneratedTasks([])
    setSelectedIds(new Set())
    try {
      const memberInputs = members.map((m) => ({
        id: m.user_id,
        display_name: (m as SpaceMember & { profiles?: { display_name?: string } }).profiles?.display_name ?? m.user_id,
      }))
      const tasks = await callGenerateTasks(prompt.trim(), memberInputs)
      setGeneratedTasks(tasks)
      setSelectedIds(new Set(tasks.map((_, i) => i)))
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể tạo task')
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleSelect = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) { next.delete(idx) } else { next.add(idx) }
      return next
    })
  }

  const handleSave = async () => {
    if (!activeSpaceId || !userId || selectedIds.size === 0) return
    setIsSaving(true)
    const toInsert = [...selectedIds].map((i) => {
      const t = generatedTasks[i]
      const assignee = members.find(
        (m) => (m as SpaceMember & { profiles?: { display_name?: string } }).profiles?.display_name === t.assignee_display_name,
      )
      return {
        space_id: activeSpaceId,
        name: t.name,
        icon: t.icon,
        frequency: t.frequency,
        assignee_id: assignee?.user_id ?? null,
        created_by: userId,
      }
    })

    const { error } = await supabase.from('tasks').insert(toInsert)
    setIsSaving(false)
    if (error) {
      Alert.alert('Lỗi', error.message)
      return
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    router.back()
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title="✨ AI Gợi ý Task" showBack />

      <View style={styles.promptRow}>
        <View style={[styles.inputWrap, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Mô tả nhà bạn… VD: Căn hộ 2 người, có chó nhỏ"
            placeholderTextColor={c.textLight}
            multiline
            style={[styles.promptInput, { color: c.textDark }]}
            returnKeyType="done"
            blurOnSubmit
          />
        </View>
        <Pressable
          onPress={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          style={[
            styles.genBtn,
            { backgroundColor: c.bg },
            !prompt.trim() || isGenerating ? shadow('raised', 'sm') : shadow('accent', 'sm'),
            { opacity: !prompt.trim() || isGenerating ? 0.5 : 1 },
          ]}
        >
          {isGenerating ? (
            <ActivityIndicator color={c.accent} size="small" />
          ) : (
            <Text style={{ fontSize: 22 }}>✨</Text>
          )}
        </Pressable>
      </View>

      {isGenerating && (
        <View style={styles.thinking}>
          <ActivityIndicator color={c.accent} />
          <Text style={[styles.thinkingText, { color: c.textMid }]}>Đang suy nghĩ…</Text>
        </View>
      )}

      {generatedTasks.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: c.textMid }]}>
            {selectedIds.size}/{generatedTasks.length} task được chọn — nhấn để bỏ chọn
          </Text>
          <FlatList
            data={generatedTasks}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => {
              const selected = selectedIds.has(index)
              return (
                <Pressable
                  onPress={() => toggleSelect(index)}
                  style={[
                    styles.taskCard,
                    { backgroundColor: c.bg },
                    selected ? shadow('raised', 'md') : shadow('inset', 'sm'),
                    { opacity: selected ? 1 : 0.5 },
                  ]}
                >
                  <Text style={styles.taskIcon}>{item.icon}</Text>
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskName, { color: c.textDark }]}>{item.name}</Text>
                    <View style={styles.taskMeta}>
                      <Text style={[styles.taskFreq, { color: c.accent }]}>
                        {FREQ_LABELS[item.frequency]}
                      </Text>
                      {item.assignee_display_name && (
                        <Text style={[styles.taskAssignee, { color: c.textMid }]}>
                          · {item.assignee_display_name}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text style={{ fontSize: 18, color: selected ? c.accent : c.textLight }}>
                    {selected ? '✓' : '○'}
                  </Text>
                </Pressable>
              )
            }}
          />

          <View style={styles.footer}>
            <NButton
              label={`Thêm ${selectedIds.size} task`}
              onPress={handleSave}
              isLoading={isSaving}
              isDisabled={selectedIds.size === 0}
              fullWidth
            />
          </View>
        </>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  promptRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  inputWrap: { flex: 1, borderRadius: RADIUS.input, paddingHorizontal: 16, paddingVertical: 12, minHeight: 60 },
  promptInput: { fontSize: 15, fontWeight: '500', lineHeight: 22 },
  genBtn: { width: 60, height: 60, borderRadius: RADIUS.card, alignItems: 'center', justifyContent: 'center' },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  thinkingText: { fontSize: 14 },
  sectionLabel: { fontSize: 12, paddingHorizontal: 16, paddingVertical: 8 },
  list: { paddingHorizontal: 16, gap: 10, paddingBottom: 120 },
  taskCard: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.card, padding: 16, gap: 12 },
  taskIcon: { fontSize: 28 },
  taskInfo: { flex: 1, gap: 3 },
  taskName: { fontSize: 15, fontWeight: '600' },
  taskMeta: { flexDirection: 'row', alignItems: 'center' },
  taskFreq: { fontSize: 12, fontWeight: '500' },
  taskAssignee: { fontSize: 12 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 32 },
})
