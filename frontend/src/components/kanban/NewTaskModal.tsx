import { useState, useEffect, useRef } from 'react'
import { Modal } from '../ui/Modal'
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

interface NewTaskModalProps {
  isOpen: boolean
  onClose: () => void
  stageId: number
  workspaceId: number
  onCreate: (data: { 
    title: string
    description?: string
    stage_id: number
    position: number
    start_date?: string
    due_date?: string
  }) => Promise<void>
  onUpdate: () => void
}

export function NewTaskModal({ isOpen, onClose, stageId, workspaceId, onCreate, onUpdate }: NewTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  const [taskTags, setTaskTags] = useState<Tag[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [editingTags, setEditingTags] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('blue')
  const tagSelectorRef = useRef<HTMLDivElement>(null)

  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [addingSubtask, setAddingSubtask] = useState(false)

  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)

  const tagColors = ['gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red']

  useEffect(() => {
    if (isOpen) {
      loadData()
      // Reset form
      setTitle('')
      setDescription('')
      setStartDate('')
      setDueDate('')
      setTaskTags([])
      setSubtasks([])
      setAttachments([])
    }
  }, [isOpen])

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

  const loadData = async () => {
    try {
      const allTagsRes = await tagsApi.list(workspaceId)
      setAvailableTags(allTagsRes.data)
    } catch (error) {
      console.error('Erro ao carregar tags:', error)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) return

    setSaving(true)
    try {
      // Criar task primeiro
      const position = subtasks.length + attachments.length // Posição baseada em quantos itens já tem
      await onCreate({
        title: title.trim(),
        description: description || undefined,
        stage_id: stageId,
        position,
        start_date: startDate || undefined,
        due_date: dueDate || undefined,
      })

      // Se tiver tags, subtasks ou attachments, precisamos criar a task primeiro
      // e depois adicionar esses itens. Mas como onCreate já cria, vamos recarregar
      // e depois adicionar os extras se necessário
      await onUpdate()
      onClose()
    } catch (error) {
      console.error('Erro ao criar task:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddTag = (tagId: number) => {
    const tag = availableTags.find(t => t.id === tagId)
    if (tag && !taskTags.find(t => t.id === tagId)) {
      setTaskTags([...taskTags, tag])
    }
    setShowTagSelector(false)
  }

  const handleRemoveTag = (tagId: number) => {
    setTaskTags(taskTags.filter(t => t.id !== tagId))
  }

  const handleDeleteTag = async (tagId: number) => {
    try {
      await tagsApi.delete(tagId)
      await loadData()
      // Remover da lista de tags disponíveis e das tags da task se estiver
      setAvailableTags(prev => prev.filter(t => t.id !== tagId))
      setTaskTags(prev => prev.filter(t => t.id !== tagId))
    } catch (error) {
      console.error('Erro ao excluir tag:', error)
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
      setTaskTags([...taskTags, res.data])
      setAvailableTags([...availableTags, res.data])
      setNewTagName('')
      setShowTagSelector(false)
    } catch (error) {
      console.error('Erro ao criar tag:', error)
    }
  }

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return

    setAddingSubtask(true)
    // Adicionar localmente - será criado depois que a task for criada
    setSubtasks([...subtasks, {
      id: Date.now(), // ID temporário
      title: newSubtaskTitle.trim(),
      is_completed: false,
      task_id: 0, // Será atualizado depois
      position: subtasks.length,
    }])
    setNewSubtaskTitle('')
    setAddingSubtask(false)
  }

  const handleDeleteSubtask = (subtaskId: number) => {
    setSubtasks(subtasks.filter(s => s.id !== subtaskId))
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

      // Adicionar localmente - será criado depois que a task for criada
      setAttachments([...attachments, {
        id: Date.now(), // ID temporário
        file_url: urlData.publicUrl,
        file_name: file.name,
        task_id: 0, // Será atualizado depois
        created_at: new Date().toISOString(),
      }])
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAttachment = (attachmentId: number) => {
    setAttachments(attachments.filter(a => a.id !== attachmentId))
  }

  const completedSubtasks = subtasks.filter(s => s.is_completed).length
  const subtaskProgress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              style={{ fontSize: 18, fontWeight: 600 }}
              placeholder="Título da tarefa"
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave} disabled={saving || !title.trim()} className="btn btn-primary">
              {saving ? <Loader2 size={14} className="spinner" /> : <Save size={14} />}
              Criar
            </button>
            <button onClick={onClose} className="btn btn-secondary btn-icon">
              <X size={14} />
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
                <div className="dropdown fade-in" style={{ left: 0, top: '100%', marginTop: 4, width: 220, zIndex: 200 }}>
                  {availableTags.length > 0 && (
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>Tags existentes</div>
                        <button 
                          onClick={() => setEditingTags(!editingTags)} 
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 11, padding: '2px 6px', height: 'auto' }}
                        >
                          {editingTags ? 'Concluir' : 'Editar'}
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {availableTags
                          .filter(t => !taskTags.find(tt => tt.id === t.id))
                          .map((tag) => (
                            <button
                              key={tag.id}
                              onClick={() => editingTags ? handleDeleteTag(tag.id) : handleAddTag(tag.id)}
                              className="tag"
                              style={{ 
                                cursor: 'pointer', 
                                border: 'none',
                                backgroundColor: `${tag.color}20`,
                                color: tag.color,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              {tag.name}
                              {editingTags && (
                                <X size={10} />
                              )}
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
            Descrição
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            rows={3}
            placeholder="Adicione uma descrição..."
          />
        </div>

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Clock size={14} />
              Início
            </label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Calendar size={14} />
              Entrega
            </label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
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
                <div className="checkbox">
                  {subtask.is_completed && <Check size={10} />}
                </div>
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
    </Modal>
  )
}

