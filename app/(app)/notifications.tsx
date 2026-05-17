import { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NHeader } from '@/components/ui/NHeader'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { useTheme } from '@/hooks/useTheme'
import { RADIUS } from '@/constants/theme'
import { useStore } from '@/stores'
import { getRecentCompletions, getTasksForSpace, getSpaceMembers } from '@/lib/api'
import type { Task, TaskCompletion, SpaceMember } from '@/types'

interface InboxEntry {
  id: string
  emoji: string
  title: string
  body: string
  time: Date
  isMine: boolean
}

function dayBucket(d: Date): 'today' | 'yesterday' | 'week' | 'older' {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const compare = new Date(d)
  compare.setHours(0, 0, 0, 0)
  const diff = Math.round((now.getTime() - compare.getTime()) / 86400000)
  if (diff === 0) return 'today'
  if (diff === 1) return 'yesterday'
  if (diff < 7) return 'week'
  return 'older'
}

const BUCKET_LABEL: Record<string, string> = {
  today: 'HÔM NAY',
  yesterday: 'HÔM QUA',
  week: 'TUẦN NÀY',
  older: 'CŨ HƠN',
}

export default function NotificationsScreen() {
  const router = useRouter()
  const userId = useStore((s) => s.user?.id)
  const activeSpaceId = useStore((s) => s.activeSpaceId)
  const { shadow } = useNeumorphic()
  const { c } = useTheme()

  const [tasks, setTasks] = useState<Task[]>([])
  const [completions, setCompletions] = useState<TaskCompletion[]>([])
  const [members, setMembers] = useState<SpaceMember[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!activeSpaceId || !userId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    Promise.all([
      getRecentCompletions(activeSpaceId, 14),
      getTasksForSpace(activeSpaceId),
      getSpaceMembers(activeSpaceId),
    ])
      .then(([nextCompletions, nextTasks, nextMembers]) => {
        setCompletions(nextCompletions)
        setTasks(nextTasks)
        setMembers(nextMembers)
      })
      .finally(() => setIsLoading(false))
  }, [activeSpaceId, userId])

  const tasksById = new Map(tasks.map((t) => [t.id, t]))
  const membersById = new Map(members.map((m) => [m.user_id, m]))

  const entries: InboxEntry[] = completions
    .filter((c) => !c.is_skipped)
    .map((c) => {
      const task = tasksById.get(c.task_id)
      const actor = membersById.get(c.completed_by)
      const actorName = actor?.profiles?.display_name ?? 'Ai đó'
      const actorEmoji = actor?.profiles?.avatar_emoji ?? '👤'
      const isMine = c.completed_by === userId
      return {
        id: c.id,
        emoji: task?.icon ?? '📋',
        title: isMine ? 'Bạn vừa tick xong' : `${actorEmoji} ${actorName} vừa tick xong`,
        body: task ? `${task.icon} ${task.name}` : 'Task',
        time: new Date(c.completed_at),
        isMine,
      }
    })

  const grouped: Record<string, InboxEntry[]> = {}
  for (const e of entries) {
    const b = dayBucket(e.time)
    if (!grouped[b]) grouped[b] = []
    grouped[b].push(e)
  }
  const order: (keyof typeof BUCKET_LABEL)[] = ['today', 'yesterday', 'week', 'older']

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={styles.headerRow}>
        <NHeader step={0} total={0} onBack={() => router.back()} />
        <View style={{ flex: 1 }} />
      </View>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: c.textDark }]}>Thông báo</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.accent} />
        </View>
      ) : entries.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: c.bg, ...shadow('raised', 'md') }]}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={[styles.emptyTitle, { color: c.textDark }]}>Không có thông báo nào.</Text>
          <Text style={[styles.emptySub, { color: c.textMid }]}>
            Khi mọi người trong Space tick task, hoạt động sẽ hiện ở đây.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {order.map((bucket) => {
            const list = grouped[bucket]
            if (!list || list.length === 0) return null
            return (
              <View key={bucket} style={{ marginBottom: 18 }}>
                <Text style={[styles.bucketLabel, { color: c.textMid }]}>{BUCKET_LABEL[bucket]}</Text>
                <View style={styles.list}>
                  {list.map((e) => (
                    <Pressable
                      key={e.id}
                      style={[styles.row, { backgroundColor: c.bg, ...shadow('raised', 'sm') }]}
                    >
                      <View style={[styles.iconBox, { backgroundColor: c.bg, ...shadow('inset', 'sm') }]}>
                        <Text style={styles.iconEmoji}>{e.emoji}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.rowTitle, { color: c.textDark }]} numberOfLines={1}>
                          {e.title}
                        </Text>
                        <Text style={[styles.rowBody, { color: c.textMid }]} numberOfLines={1}>
                          {e.body}
                        </Text>
                      </View>
                      <Text style={[styles.time, { color: c.textLight }]}>
                        {e.time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  headerRow: { paddingHorizontal: 24, paddingTop: 16 },
  titleRow: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 14 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.65 },

  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  bucketLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase',
    marginBottom: 10, paddingHorizontal: 4,
  },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  iconBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 18 },
  rowTitle: { fontSize: 14, fontWeight: '600' },
  rowBody: { fontSize: 12, marginTop: 2 },
  time: { fontSize: 11, marginLeft: 8 },

  center: { padding: 60, alignItems: 'center' },
  emptyCard: {
    margin: 16,
    borderRadius: RADIUS.card,
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.4 },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
})
