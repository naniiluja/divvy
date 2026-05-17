export interface Profile {
  id: string
  display_name: string
  avatar_emoji: string
  expo_push_token?: string
  created_at?: string
}

export interface Space {
  id: string
  name: string
  emoji: string
  invite_code: string
  created_by: string
  created_at?: string
}

export interface SpaceMember {
  id?: string
  space_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  profiles?: {
    display_name?: string
    avatar_emoji?: string
  }
}

export interface Task {
  id: string
  space_id: string
  name: string
  icon: string
  assignee_id?: string
  created_by?: string
  created_at?: string
}

export interface TaskCompletion {
  id: string
  task_id: string
  space_id: string
  user_id: string
  completed_by: string
  completed_at: string
  is_skipped: boolean
}

export interface InviteLink {
  id: string
  space_id: string
  token: string
  created_by?: string
  expires_at?: string
  created_at?: string
}
