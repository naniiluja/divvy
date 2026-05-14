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
  const { data, error } = await supabase
    .from('spaces')
    .select('*, space_members!inner(user_id)')
    .eq('space_members.user_id', userId)

  if (error) return []
  return (data as Space[]) ?? []
}

export async function createSpace(name: string, emoji: string, ownerId: string): Promise<Space> {
  const { data: space, error: spaceError } = await supabase
    .from('spaces')
    .insert({ name, emoji, owner_id: ownerId, created_by: ownerId })
    .select()
    .single()

  if (spaceError) throw spaceError

  const { error: memberError } = await supabase
    .from('space_members')
    .insert({ space_id: space.id, user_id: ownerId, role: 'owner' })

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

export async function createInviteLink(spaceId: string, createdBy: string): Promise<InviteLink> {
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
