import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: {
    id: string
    task_id: string
    space_id: string
    user_id: string
    completed_by: string
    is_skipped: boolean
    completed_at: string
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  if (authHeader !== `Bearer ${serviceKey}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload: WebhookPayload = await req.json()
    const { record } = payload

    if (record.is_skipped) {
      return Response.json({ ok: true, skipped: true })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey)

    const [taskResult, membersResult, actorResult] = await Promise.all([
      supabase.from('tasks').select('name, icon').eq('id', record.task_id).single(),
      supabase.from('space_members').select('user_id').eq('space_id', record.space_id).neq('user_id', record.completed_by),
      supabase.from('profiles').select('display_name, avatar_emoji').eq('id', record.completed_by).single(),
    ])

    if (taskResult.error || membersResult.error || !membersResult.data?.length) {
      return Response.json({ ok: true, reason: 'no recipients or missing task' })
    }

    const task = taskResult.data
    const actor = actorResult.data
    const actorName = actor?.display_name ?? 'Ai đó'
    const actorEmoji = actor?.avatar_emoji ?? '👤'

    const recipientIds = membersResult.data.map((m: { user_id: string }) => m.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('expo_push_token')
      .in('id', recipientIds)
      .not('expo_push_token', 'is', null)

    if (!profiles?.length) {
      return Response.json({ ok: true, reason: 'no push tokens' })
    }

    const tokens = profiles
      .map((p: { expo_push_token: string | null }) => p.expo_push_token)
      .filter(Boolean) as string[]

    const messages = tokens.map(token => ({
      to: token,
      title: `${actorEmoji} ${actorName} vừa tick xong`,
      body: `${task.icon} ${task.name}`,
      data: { spaceId: record.space_id, taskId: record.task_id, type: 'task_completed' },
      sound: 'default',
      priority: 'normal',
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

    return Response.json({ ok: true, sent: tokens.length })
  } catch (error) {
    console.error('notify-task-completion error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
})
