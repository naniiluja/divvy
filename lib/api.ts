import { supabase } from './supabase'
import type { Profile, Space, SpaceMember, Task, TaskCompletion, InviteLink } from '@/types'

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data as Profile
}

export async function upsertProfile(profile: Omit<Profile, 'created_at'>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile)
    .select()
    .single()

  if (error) throw error
  return data as Profile
}

export async function getSpacesForUser(userId: string): Promise<Space[]> {
  const { data: memberRows, error: memberError } = await supabase
    .from('space_members')
    .select('space_id')
    .eq('user_id', userId)

  if (memberError || !memberRows?.length) return []

  const spaceIds = memberRows.map((r) => r.space_id)

  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .in('id', spaceIds)

  if (error) return []
  return (data as Space[]) ?? []
}

export async function createSpace(name: string, emoji: string): Promise<Space> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')

  const uid = session.user.id

  const { data: space, error: spaceError } = await supabase
    .from('spaces')
    .insert({ name, emoji, owner_id: uid, created_by: uid })
    .select()
    .single()

  if (spaceError) throw spaceError

  const { error: memberError } = await supabase
    .from('space_members')
    .insert({ space_id: space.id, user_id: uid, role: 'owner' })

  if (memberError) throw memberError

  return space as Space
}

export async function getSpaceByInviteCode(inviteCode: string): Promise<Space | null> {
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('invite_code', inviteCode)
    .single()

  if (error) return null
  return data as Space
}

export async function joinSpace(spaceId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('space_members')
    .insert({ space_id: spaceId, user_id: userId, role: 'member' })

  if (error) throw error
}

export async function getSpaceMembers(spaceId: string): Promise<SpaceMember[]> {
  const { data: memberRows, error: memberErr } = await supabase
    .from('space_members')
    .select('*')
    .eq('space_id', spaceId)

  if (memberErr || !memberRows?.length) return []

  const userIds = memberRows.map((m) => m.user_id)
  const { data: profileRows, error: profErr } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_emoji')
    .in('id', userIds)

  if (profErr) return memberRows as SpaceMember[]

  const profileMap = new Map(profileRows?.map((p) => [p.id, p]) ?? [])
  return memberRows.map((m) => {
    const profile = profileMap.get(m.user_id)
    return {
      ...m,
      profiles: profile
        ? { display_name: profile.display_name ?? '', avatar_emoji: profile.avatar_emoji ?? '' }
        : undefined,
    }
  }) as SpaceMember[]
}

export async function getOrCreateInviteLink(spaceId: string, createdBy: string): Promise<InviteLink> {
  const now = new Date().toISOString()
  const { data: existing } = await supabase
    .from('invite_links')
    .select('*')
    .eq('space_id', spaceId)
    .eq('created_by', createdBy)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existing) return existing as InviteLink

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data, error } = await supabase
    .from('invite_links')
    .insert({ space_id: spaceId, created_by: createdBy, expires_at: expiresAt.toISOString() })
    .select()
    .single()

  if (error) throw error
  return data as InviteLink
}

export async function getInviteLinkByToken(token: string): Promise<InviteLink | null> {
  const { data, error } = await supabase
    .from('invite_links')
    .select('*, spaces(id, name, emoji)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error) return null
  return data as InviteLink
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (error) return null
  return data as Task
}

function daysAgoISO(days: number): string {
  const since = new Date()
  since.setDate(since.getDate() - days)
  return since.toISOString()
}

function startOfTodayISO(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}T00:00:00`
}

async function fetchCompletionsSince(
  field: 'task_id' | 'space_id',
  value: string,
  sinceISO: string,
): Promise<TaskCompletion[]> {
  const { data, error } = await supabase
    .from('task_completions')
    .select('*')
    .eq(field, value)
    .gte('completed_at', sinceISO)
    .order('completed_at', { ascending: false })

  if (error) return []
  return (data as TaskCompletion[]) ?? []
}

export async function getCompletionsForTask(taskId: string, days = 7): Promise<TaskCompletion[]> {
  return fetchCompletionsSince('task_id', taskId, daysAgoISO(days))
}

export async function getTasksForSpace(spaceId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('space_id', spaceId)
    .eq('is_active', true)

  if (error) return []
  return (data as Task[]) ?? []
}

export async function getRecentCompletions(spaceId: string, days = 7): Promise<TaskCompletion[]> {
  return fetchCompletionsSince('space_id', spaceId, daysAgoISO(days))
}

export async function getTodayCompletions(spaceId: string): Promise<TaskCompletion[]> {
  return fetchCompletionsSince('space_id', spaceId, startOfTodayISO())
}

async function insertCompletion(
  taskId: string,
  spaceId: string,
  userId: string,
  isSkipped: boolean,
): Promise<TaskCompletion> {
  const { data, error } = await supabase
    .from('task_completions')
    .insert({
      task_id: taskId,
      space_id: spaceId,
      user_id: userId,
      completed_by: userId,
      is_skipped: isSkipped,
    })
    .select()
    .single()

  if (error) throw error
  return data as TaskCompletion
}

export function addCompletion(taskId: string, spaceId: string, userId: string): Promise<TaskCompletion> {
  return insertCompletion(taskId, spaceId, userId, false)
}

export function skipTask(taskId: string, spaceId: string, userId: string): Promise<TaskCompletion> {
  return insertCompletion(taskId, spaceId, userId, true)
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw error
}

export async function deleteCompletion(completionId: string): Promise<void> {
  const { error } = await supabase.from('task_completions').delete().eq('id', completionId)
  if (error) throw error
}

export async function getSpaceById(spaceId: string): Promise<Space | null> {
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('id', spaceId)
    .single()

  if (error) return null
  return data as Space
}

export interface GeneratedTask {
  name: string
  icon: string
  assignee_display_name: string | null
}

// FunctionsHttpError exposes the response body via `error.context` (a Response).
// We unwrap it to surface the actual server-side message rather than a generic "non-2xx".
async function unwrapFunctionError(error: { message: string; context?: Response }): Promise<string> {
  const ctx = error.context
  if (!ctx || typeof ctx.text !== 'function') return error.message

  try {
    const bodyText = await ctx.clone().text()
    if (!bodyText) return error.message
    try {
      const parsed = JSON.parse(bodyText) as { error?: string; message?: string }
      return parsed.error ?? parsed.message ?? bodyText
    } catch {
      return bodyText
    }
  } catch {
    return error.message
  }
}

export async function callGenerateTasks(
  input: string,
  members: { id: string; display_name: string }[],
): Promise<GeneratedTask[]> {
  if (!members.length) {
    throw new Error('Chưa có thành viên trong Space — không thể chia task.')
  }
  const { data, error } = await supabase.functions.invoke('generate-tasks', {
    body: { input, members },
  })

  if (error) {
    const detail = await unwrapFunctionError(error as { message: string; context?: Response })
    throw new Error(detail)
  }
  if (data?.error) throw new Error(data.error)
  return data.tasks as GeneratedTask[]
}
