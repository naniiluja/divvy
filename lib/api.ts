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
  const { data, error } = await supabase
    .from('space_members')
    .select('*, profiles(display_name, avatar_emoji)')
    .eq('space_id', spaceId)

  if (error) return []
  return (data as SpaceMember[]) ?? []
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
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('task_completions')
    .select('*')
    .eq('space_id', spaceId)
    .gte('completed_at', since.toISOString())
    .order('completed_at', { ascending: false })

  if (error) return []
  return (data as TaskCompletion[]) ?? []
}

export async function getTodayCompletions(spaceId: string): Promise<TaskCompletion[]> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('task_completions')
    .select('*')
    .eq('space_id', spaceId)
    .gte('completed_at', startOfDay.toISOString())
    .order('completed_at', { ascending: false })

  if (error) return []
  return (data as TaskCompletion[]) ?? []
}

export async function addCompletion(
  taskId: string,
  spaceId: string,
  userId: string,
): Promise<TaskCompletion> {
  const { data, error } = await supabase
    .from('task_completions')
    .insert({ task_id: taskId, space_id: spaceId, user_id: userId, completed_by: userId, is_skipped: false })
    .select()
    .single()

  if (error) throw error
  return data as TaskCompletion
}

export async function skipTask(
  taskId: string,
  spaceId: string,
  userId: string,
): Promise<TaskCompletion> {
  const { data, error } = await supabase
    .from('task_completions')
    .insert({ task_id: taskId, space_id: spaceId, user_id: userId, completed_by: userId, is_skipped: true })
    .select()
    .single()

  if (error) throw error
  return data as TaskCompletion
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
  frequency: 'daily' | 'weekly' | '3x_week'
  assignee_display_name: string | null
}

export async function callGenerateTasks(
  input: string,
  members: { id: string; display_name: string }[],
): Promise<GeneratedTask[]> {
  const { data, error } = await supabase.functions.invoke('generate-tasks', {
    body: { input, members },
  })

  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data.tasks as GeneratedTask[]
}
