import axios from 'axios'
import { supabase } from './supabase'

const API_BASE_URL = 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar o token de autenticação em todas as requisições
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      supabase.auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ==================== WORKSPACES ====================
export const workspacesApi = {
  list: () => api.get('/workspaces/'),
  create: (data: { name: string; description?: string }) => api.post('/workspaces/', data),
  get: (id: number) => api.get(`/workspaces/${id}/`),
  update: (id: number, data: { name?: string; description?: string }) => api.put(`/workspaces/${id}/`, data),
  delete: (id: number) => api.delete(`/workspaces/${id}/`),
}

// ==================== BOARDS ====================
export const boardsApi = {
  list: (workspaceId?: number) => api.get('/boards/', { params: workspaceId ? { workspace_id: workspaceId } : {} }),
  create: (data: { name: string; workspace_id: number; position?: number }) => api.post('/boards/', data),
  get: (id: number) => api.get(`/boards/${id}/`),
  update: (id: number, data: { name?: string; position?: number }) => api.put(`/boards/${id}/`, data),
  delete: (id: number) => api.delete(`/boards/${id}/`),
}

// ==================== STAGES ====================
export const stagesApi = {
  list: (boardId?: number) => api.get('/boards/stages/', { params: boardId ? { board_id: boardId } : {} }),
  create: (data: { name: string; board_id: number; position?: number; color?: string }) => api.post('/boards/stages/', data),
  get: (id: number) => api.get(`/boards/stages/${id}/`),
  update: (id: number, data: { name?: string; position?: number; color?: string }) => api.put(`/boards/stages/${id}/`, data),
  delete: (id: number) => api.delete(`/boards/stages/${id}/`),
}

// ==================== TASKS ====================
export const tasksApi = {
  list: (stageId?: number) => api.get('/tasks/', { params: stageId ? { stage_id: stageId } : {} }),
  create: (data: { 
    title: string; 
    description?: string;
    stage_id: number; 
    position?: number;
    start_date?: string;
    due_date?: string;
  }) => api.post('/tasks/', data),
  get: (id: number) => api.get(`/tasks/${id}/`),
  update: (id: number, data: { 
    title?: string; 
    description?: string;
    position?: number;
    start_date?: string | null;
    due_date?: string | null;
  }) => api.put(`/tasks/${id}/`, data),
  delete: (id: number) => api.delete(`/tasks/${id}/`),
  move: (id: number, data: { stage_id: number; position: number }) => api.patch(`/tasks/${id}/move/`, data),
}

// ==================== TAGS ====================
export const tagsApi = {
  list: (workspaceId?: number) => api.get('/tasks/tags/', { params: workspaceId ? { workspace_id: workspaceId } : {} }),
  create: (data: { name: string; color: string; workspace_id: number }) => api.post('/tasks/tags/', data),
  get: (id: number) => api.get(`/tasks/tags/${id}/`),
  update: (id: number, data: { name?: string; color?: string }) => api.put(`/tasks/tags/${id}/`, data),
  delete: (id: number) => api.delete(`/tasks/tags/${id}/`),
  addToTask: (taskId: number, tagId: number) => api.post(`/tasks/${taskId}/tags/${tagId}/`),
  removeFromTask: (taskId: number, tagId: number) => api.delete(`/tasks/${taskId}/tags/${tagId}/`),
  listForTask: (taskId: number) => api.get(`/tasks/${taskId}/tags/`),
}

// ==================== SUBTASKS ====================
export const subtasksApi = {
  list: (taskId?: number) => api.get('/tasks/subtasks/', { params: taskId ? { task_id: taskId } : {} }),
  create: (data: { title: string; task_id: number; is_completed?: boolean; position?: number }) => api.post('/tasks/subtasks/', data),
  get: (id: number) => api.get(`/tasks/subtasks/${id}/`),
  update: (id: number, data: { title?: string; is_completed?: boolean; position?: number }) => api.put(`/tasks/subtasks/${id}/`, data),
  delete: (id: number) => api.delete(`/tasks/subtasks/${id}/`),
}

// ==================== ATTACHMENTS ====================
export const attachmentsApi = {
  list: (taskId?: number) => api.get('/tasks/attachments/', { params: taskId ? { task_id: taskId } : {} }),
  create: (data: { file_url: string; file_name: string; task_id: number }) => api.post('/tasks/attachments/', data),
  get: (id: number) => api.get(`/tasks/attachments/${id}/`),
  update: (id: number, data: { file_url?: string; file_name?: string }) => api.put(`/tasks/attachments/${id}/`, data),
  delete: (id: number) => api.delete(`/tasks/attachments/${id}/`),
}

// ==================== OVERVIEW ====================
export const overviewApi = {
  list: (params?: { period?: 'day' | 'week' | 'month'; ref_date?: string }) => 
    api.get('/overview/', { params }),
}




