export interface Workspace {
  id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Board {
  id: number
  name: string
  workspace_id: number
  position: number
  created_at: string
  updated_at: string
}

export interface Stage {
  id: number
  name: string
  board_id: number
  position: number
  color: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: number
  title: string
  description: string | null
  stage_id: number
  position: number
  start_date: string | null
  due_date: string | null
  created_at: string
  updated_at: string
  tags?: Tag[]
}

export interface Tag {
  id: number
  name: string
  color: string
  workspace_id: number
}

export interface Subtask {
  id: number
  title: string
  is_completed: boolean
  task_id: number
  position: number
}

export interface Attachment {
  id: number
  file_url: string
  file_name: string
  task_id: number
  created_at: string
}

export interface User {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}


