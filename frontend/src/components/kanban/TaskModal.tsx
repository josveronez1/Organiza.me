import { useState, useEffect, useRef } from 'react'
import { Modal } from '../ui/Modal'
import { ConfirmModal } from '../ui/ConfirmModal'
import { Task, Tag, Subtask, Attachment } from '../../types'
import { tasksApi, tagsApi, subtasksApi, attachmentsApi } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import {
  Calendar,
  Tag as TagIcon,
  CheckSquare,
  Paperclip,
  Trash2,
  Plus,
  X,
  Loader2,
  Pencil,
  Save,
  AlignLeft,
  Clock,
  Upload,
  ExternalLink,
  Check
} from 'lucide-react'
import { format } from 'date-fns'

// Mapeamento de cores de nome para hex
const TAG_COLORS: Record<string, string> = {
  gray: '#787774',
  brown: '#9F6B53',
  orange: '#D9730D',
  yellow: '#CB912F',
  green: '#448361',
  blue: '#337EA9',
  purple: '#9065B0',
  pink: '#C14C8A',
  red: '#D44C47',
}

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task
  workspaceId: number
  onUpdate: () => void
}

export function TaskModal({ isOpen, onClose, task, workspaceId, onUpdate }: TaskModalProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [startDate, setStartDate] = useState(task.start_date || '')
  const [dueDate, setDueDate] = useState(task.due_date || '')
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [taskTags, setTaskTags] = useState<Tag[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('blue')
  const tagSelectorRef = useRef<HTMLDivElement>(null)

  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [addingSubtask, setAddingSubtask] = useState(false)

  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const tagColors = ['gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red']

  useEffect(() => {
    if (isOpen) {
      loadTaskData()
    }
  }, [isOpen, task.id])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tagSelectorRef.current && !tagSelectorRef.current.contains(event.target as Node)) {
        setShowTagSelector(false)
      }
    }
    
    if (showTagSelector) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTagSelector])

  const loadTaskData = async () => {
    try {
      const [tagsRes, allTagsRes, subtasksRes, attachmentsRes] = await Promise.all([
        tagsApi.listForTask(task.id),
        tagsApi.list(workspaceId),
        subtasksApi.list(task.id),
        attachmentsApi.list(task.id),
      ])

      setTaskTags(tagsRes.data)
      setAvailableTags(allTagsRes.data)
      setSubtasks(subtasksRes.data)
      setAttachments(attachmentsRes.data)
    } catch (error) {
      console.error('Erro ao carregar dados da task:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await tasksApi.update(task.id, {
        title,
        description: description || null,
        start_date: startDate || null,
        due_date: dueDate || null,
      })
      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Erro ao salvar task:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await tasksApi.delete(task.id)
      onUpdate()
    } catch (error) {
      console.error('Erro ao excluir task:', error)
    }
  }

  const handleAddTag = async (tagId: number) => {
    try {
      await tagsApi.addToTask(task.id, tagId)
      await loadTaskData()
    } catch (error) {
      console.error('Erro ao adicionar tag:', error)
    }
    setShowTagSelector(false)
  }

  const handleRemoveTag = async (tagId: number) => {
    try {
      await tagsApi.removeFromTask(task.id, tagId)
      await loadTaskData()
    } catch (error) {
      console.error('Erro ao remover tag:', error)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    try {
      const res = await tagsApi.create({
        name: newTagName.trim(),
        color: TAG_COLORS[newTagColor] || '#337EA9',
        workspace_id: workspaceId,
      })
      await tagsApi.addToTask(task.id, res.data.id)
      await loadTaskData()
      setNewTagName('')
      setShowTagSelector(false)
    } catch (error) {
      console.error('Erro ao criar tag:', error)
    }
  }

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return

    setAddingSubtask(true)
    try {
      await subtasksApi.create({
        title: newSubtaskTitle.trim(),
        task_id: task.id,
        position: subtasks.length,
      })
      await loadTaskData()
      setNewSubtaskTitle('')
    } catch (error) {
      console.error('Erro ao criar subtask:', error)
    } finally {
      setAddingSubtask(false)
    }
  }

  const handleToggleSubtask = async (subtask: Subtask) => {
    try {
      await subtasksApi.update(subtask.id, {
        is_completed: !subtask.is_completed,
      })
      await loadTaskData()
    } catch (error) {
      console.error('Erro ao atualizar subtask:', error)
    }
  }

  const handleDeleteSubtask = async (subtaskId: number) => {
    try {
      await subtasksApi.delete(subtaskId)
      await loadTaskData()
    } catch (error) {
      console.error('Erro ao excluir subtask:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileName = `${Date.now()}-${file.name}`
      const { error } = await supabase.storage
        .from('attachments')
        .upload(fileName, file)

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(fileName)

      await attachmentsApi.create({
        file_url: urlData.publicUrl,
        file_name: file.name,
        task_id: task.id,
      })

      await loadTaskData()
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await attachmentsApi.delete(attachmentId)
      await loadTaskData()
    } catch (error) {
      console.error('Erro ao excluir anexo:', error)
    }
  }

  const completedSubtasks = subtasks.filter(s => s.is_completed).length
  const subtaskProgress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                style={{ fontSize: 18, fontWeight: 600 }}
                autoFocus
              />
            ) : (
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h2>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isEditing ? (
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                {saving ? <Loader2 size={14} className="spinner" /> : <Save size={14} />}
                Salvar
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="btn btn-secondary">
                <Pencil size={14} />
                Editar
              </button>
            )}
            <button onClick={() => setConfirmDelete(true)} className="btn btn-danger btn-icon">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <TagIcon size={14} />
            Tags
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {taskTags.map((tag) => (
              <span 
                key={tag.id} 
                className="tag" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 4,
                  backgroundColor: `${tag.color}20`,
                  color: tag.color
                }}
              >
                {tag.name}
                <button onClick={() => handleRemoveTag(tag.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'inherit' }}>
                  <X size={10} />
                </button>
              </span>
            ))}
            <div style={{ position: 'relative' }} ref={tagSelectorRef}>
              <button onClick={() => setShowTagSelector(!showTagSelector)} className="btn btn-ghost btn-sm">
                <Plus size={12} />
                Adicionar
              </button>

              {showTagSelector && (
                <div className="dropdown fade-in" style={{ left: 0, top: '100%', marginTop: 4, width: 220 }}>
                  {availableTags.filter(t => !taskTags.find(tt => tt.id === t.id)).length > 0 && (
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>Tags existentes</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {availableTags
                          .filter(t => !taskTags.find(tt => tt.id === t.id))
                          .map((tag) => (
                            <button
                              key={tag.id}
                              onClick={() => handleAddTag(tag.id)}
                              className="tag"
                              style={{ 
                                cursor: 'pointer', 
                                border: 'none',
                                backgroundColor: `${tag.color}20`,
                                color: tag.color
                              }}
                            >
                              {tag.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                  <div style={{ padding: '8px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>Criar nova tag</div>
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Nome"
                      className="input"
                      style={{ marginBottom: 8 }}
                    />
                    <div className="color-picker" style={{ marginBottom: 8 }}>
                      {tagColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewTagColor(color)}
                          className={`color-option ${newTagColor === color ? 'selected' : ''}`}
                          style={{ 
                            width: 20, 
                            height: 20,
                            backgroundColor: `var(--tag-${color})`,
                            borderColor: newTagColor === color ? 'var(--text-primary)' : 'transparent'
                          }}
                        />
                      ))}
                    </div>
                    <button onClick={handleCreateTag} disabled={!newTagName.trim()} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                      Criar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <AlignLeft size={14} />
            Descricao
          </label>
          {isEditing ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              rows={3}
              placeholder="Adicione uma descricao..."
            />
          ) : (
            <p style={{ fontSize: 14, color: description ? 'var(--text-primary)' : 'var(--text-tertiary)', lineHeight: 1.6 }}>
              {description || 'Sem descricao'}
            </p>
          )}
        </div>

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Clock size={14} />
              Inicio
            </label>
            {isEditing ? (
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
            ) : (
              <p style={{ fontSize: 14, color: startDate ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                {startDate ? format(new Date(startDate), 'dd/MM/yyyy') : 'Nao definida'}
              </p>
            )}
          </div>
          <div>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Calendar size={14} />
              Entrega
            </label>
            {isEditing ? (
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
            ) : (
              <p style={{ fontSize: 14, color: dueDate ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                {dueDate ? format(new Date(dueDate), 'dd/MM/yyyy') : 'Nao definida'}
              </p>
            )}
          </div>
        </div>

        {/* Subtasks */}
        <div>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <CheckSquare size={14} />
            Subtarefas ({completedSubtasks}/{subtasks.length})
          </label>

          {subtasks.length > 0 && (
            <div className="progress" style={{ marginBottom: 12 }}>
              <div className="progress-bar" style={{ width: `${subtaskProgress}%` }} />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  padding: '6px 8px',
                  borderRadius: 4,
                  background: 'var(--bg-secondary)'
                }}
              >
                <button
                  onClick={() => handleToggleSubtask(subtask)}
                  className={`checkbox ${subtask.is_completed ? 'checked' : ''}`}
                >
                  {subtask.is_completed && <Check size={10} />}
                </button>
                <span style={{ 
                  flex: 1, 
                  fontSize: 13,
                  textDecoration: subtask.is_completed ? 'line-through' : 'none',
                  color: subtask.is_completed ? 'var(--text-tertiary)' : 'var(--text-primary)'
                }}>
                  {subtask.title}
                </span>
                <button onClick={() => handleDeleteSubtask(subtask.id)} className="btn btn-ghost btn-icon-sm" style={{ opacity: 0.5 }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
              placeholder="Adicionar subtarefa..."
              className="input"
              style={{ flex: 1 }}
            />
            <button onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim() || addingSubtask} className="btn btn-secondary">
              {addingSubtask ? <Loader2 size={14} className="spinner" /> : <Plus size={14} />}
            </button>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Paperclip size={14} />
            Anexos
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  padding: '6px 8px',
                  borderRadius: 4,
                  background: 'var(--bg-secondary)'
                }}
              >
                <Paperclip size={14} style={{ color: 'var(--text-tertiary)' }} />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }} className="truncate">
                  {attachment.file_name}
                </span>
                <a href={attachment.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon-sm">
                  <ExternalLink size={12} />
                </a>
                <button onClick={() => handleDeleteAttachment(attachment.id)} className="btn btn-ghost btn-icon-sm" style={{ opacity: 0.5 }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 8,
            padding: 16,
            border: '1px dashed var(--border-default)',
            borderRadius: 6,
            cursor: 'pointer',
            color: 'var(--text-tertiary)',
            fontSize: 13
          }}>
            {uploading ? (
              <Loader2 size={16} className="spinner" />
            ) : (
              <>
                <Upload size={16} />
                Anexar arquivo
              </>
            )}
            <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
          </label>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Excluir tarefa"
        message="Tem certeza que deseja excluir esta tarefa? Esta acao nao pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
      />
    </Modal>
  )
}
