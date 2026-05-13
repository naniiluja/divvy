import { supabase } from './supabase'
import type { Profile, Space, SpaceMember, Task, TaskCompletion } from '@/types'

// Profile
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data as Profile
}

export async function upsertProfile(profile: Omit<Profile, 'created_at'>): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile)
    .select()
    .single()

  if (error) throw error
  return data as Profile
}

// Space
export async function getSpacesForUser(userId: string): Promise<Space[]> {
  const { data, error } = await supabase
    .from('spaces')
    .select('*, space_members!inner(user_id)')
    .eq('space_members.user_id', userId)

  if (error) return []
  return (data as Space[]) ?? []
}

export async function createSpace(name: string, emoji: string, createdBy: string): Promise<Space> {
  const { data, error } = await supabase
    .from('spaces')
    .insert({ name, emoji, created_by: createdBy })
    .select()
    .single()

  if (error) throw error
  return data as Space
}

// Space Members
export async function getSpaceMembers(spaceId: string): Promise<SpaceMember[]> {
  const { data, error } = await supabase
    .from('space_members')
    .select('*')
    .eq('space_id', spaceId)

  if (error) return []
  return (data as SpaceMember[]) ?? []
}

// Tasks
export async function getTasksForSpace(spaceId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('space_id', spaceId)

  if (error) return []
  return (data as Task[]) ?? []
}

// Task Completions
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
