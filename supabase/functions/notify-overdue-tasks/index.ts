import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok')
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const encoder = new TextEncoder()
  const a = encoder.encode(authHeader.padEnd((`Bearer ${serviceKey}`).length))
  const b = encoder.encode((`Bearer ${serviceKey}`).padEnd(authHeader.length))
  let diff = a.length ^ b.length
  for (let i = 0; i < Math.min(a.length, b.length); i++) diff |= a[i] ^ b[i]
  if (diff !== 0) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey)

  try {
    const { data: overdueTasks, error } = await supabase.rpc('get_overdue_tasks')
    if (error) throw error
    if (!overdueTasks?.length) {
      return Response.json({ ok: true, overdue: 0 })
    }

    let totalSent = 0

    for (const task of overdueTasks) {
      const { data: members } = await supabase
        .from('space_members')
        .select('user_id')
        .eq('space_id', task.space_id)

      if (!members?.length) continue

      const memberIds = members.map((m: { user_id: string }) => m.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('expo_push_token')
        .in('id', memberIds)
        .not('expo_push_token', 'is', null)

      if (!profiles?.length) continue

      const tokens = profiles
        .map((p: { expo_push_token: string | null }) => p.expo_push_token)
        .filter(Boolean) as string[]

      if (!tokens.length) continue

      const messages = tokens.map(token => ({
        to: token,
        title: '⏰ Task chưa ai làm',
        body: `${task.icon} ${task.name} — cả nhóm chưa tick hôm nay`,
        data: { spaceId: task.space_id, taskId: task.id, type: 'task_overdue' },
        sound: 'default',
        priority: 'high',
      }))

      const pushRes = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(messages),
      })

      const pushData = await pushRes.json()

      const invalidTokens = (pushData.data ?? [])
        .filter((t: { status: string; details?: { error?: string } }) => t.details?.error === 'DeviceNotRegistered')
        .map((_: unknown, i: number) => tokens[i])
        .filter(Boolean)

      if (invalidTokens.length > 0) {
        await supabase
          .from('profiles')
          .update({ expo_push_token: null })
          .in('expo_push_token', invalidTokens)
      }

      totalSent += tokens.length
    }

    return Response.json({ ok: true, overdue: overdueTasks.length, sent: totalSent })
  } catch (error) {
    console.error('notify-overdue-tasks error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
})
