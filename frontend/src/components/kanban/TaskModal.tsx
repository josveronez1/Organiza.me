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

  // Tags state
  const [taskTags, setTaskTags] = useState<Tag[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('cyan')
  const tagSelectorRef = useRef<HTMLDivElement>(null)

  // Subtasks state
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [addingSubtask, setAddingSubtask] = useState(false)

  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)

  const tagColors = [
    { name: 'cyan', label: 'Cyan' },
    { name: 'green', label: 'Verde' },
    { name: 'yellow', label: 'Amarelo' },
    { name: 'orange', label: 'Laranja' },
    { name: 'red', label: 'Vermelho' },
    { name: 'pink', label: 'Rosa' },
    { name: 'purple', label: 'Roxo' },
    { name: 'blue', label: 'Azul' },
  ]

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
    if (!confirm('Tem certeza que deseja excluir esta task?')) return

    try {
      await tasksApi.delete(task.id)
      onUpdate()
    } catch (error) {
      console.error('Erro ao excluir task:', error)
    }
  }

  // Tag functions
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
        color: newTagColor,
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

  // Subtask functions
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

  // Attachment functions
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileName = `${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
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
      alert('Erro ao fazer upload do arquivo')
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
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input text-lg font-semibold w-full"
                autoFocus
              />
            ) : (
              <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight truncate">
                {title}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isEditing ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </button>
            )}
            <button
              onClick={handleDelete}
              className="btn btn-danger btn-icon"
              title="Excluir task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
            <TagIcon className="w-4 h-4" />
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {taskTags.map((tag) => (
              <span
                key={tag.id}
                className={`tag tag-${tag.color} group cursor-default`}
              >
                {tag.name}
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <div className="relative" ref={tagSelectorRef}>
              <button
                onClick={() => setShowTagSelector(!showTagSelector)}
                className="btn btn-ghost btn-sm text-[var(--text-tertiary)]"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>

              {showTagSelector && (
                <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 animate-fade-in-scale">
                  {availableTags.filter(t => !taskTags.find(tt => tt.id === t.id)).length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-[var(--text-tertiary)] mb-2">Tags existentes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {availableTags
                          .filter(t => !taskTags.find(tt => tt.id === t.id))
                          .map((tag) => (
                            <button
                              key={tag.id}
                              onClick={() => handleAddTag(tag.id)}
                              className={`tag tag-${tag.color} hover:scale-105 transition-transform`}
                            >
                              {tag.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-[var(--border-subtle)] pt-3">
                    <p className="text-xs font-medium text-[var(--text-tertiary)] mb-2">Criar nova tag</p>
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Nome da tag"
                      className="input text-sm mb-3"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                    />
                    <div className="flex gap-1.5 mb-3">
                      {tagColors.map(({ name }) => (
                        <button
                          key={name}
                          onClick={() => setNewTagColor(name)}
                          title={name}
                          className={`w-7 h-7 rounded-lg tag-${name} flex items-center justify-center transition-transform hover:scale-110 ${
                            newTagColor === name ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-surface)]' : ''
                          }`}
                        >
                          {newTagColor === name && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim()}
                      className="btn btn-primary w-full"
                    >
                      Criar Tag
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
            <AlignLeft className="w-4 h-4" />
            Descricao
          </label>
          {isEditing ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input resize-none"
              rows={4}
              placeholder="Adicione uma descricao..."
            />
          ) : (
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <p className="text-[var(--text-primary)] whitespace-pre-wrap text-sm leading-relaxed">
                {description || <span className="text-[var(--text-quaternary)] italic">Sem descricao</span>}
              </p>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
              <Clock className="w-4 h-4" />
              Data de Inicio
            </label>
            {isEditing ? (
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
              />
            ) : (
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <p className="text-sm text-[var(--text-primary)]">
                  {startDate ? format(new Date(startDate), 'dd/MM/yyyy') : <span className="text-[var(--text-quaternary)]">Nao definida</span>}
                </p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
              <Calendar className="w-4 h-4" />
              Data de Entrega
            </label>
            {isEditing ? (
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input"
              />
            ) : (
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <p className="text-sm text-[var(--text-primary)]">
                  {dueDate ? format(new Date(dueDate), 'dd/MM/yyyy') : <span className="text-[var(--text-quaternary)]">Nao definida</span>}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Subtasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
              <CheckSquare className="w-4 h-4" />
              Subtarefas
              <span className="badge badge-accent">
                {completedSubtasks}/{subtasks.length}
              </span>
            </label>
          </div>

          {subtasks.length > 0 && (
            <div className="progress">
              <div
                className="progress-bar"
                style={{ width: `${subtaskProgress}%` }}
              />
            </div>
          )}

          <div className="space-y-1">
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors group"
              >
                <button
                  onClick={() => handleToggleSubtask(subtask)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    subtask.is_completed 
                      ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--bg-base)]' 
                      : 'border-[var(--border-strong)] hover:border-[var(--accent)]'
                  }`}
                >
                  {subtask.is_completed && <Check className="w-3 h-3" />}
                </button>
                <span className={`flex-1 text-sm ${subtask.is_completed ? 'line-through text-[var(--text-quaternary)]' : 'text-[var(--text-primary)]'}`}>
                  {subtask.title}
                </span>
                <button
                  onClick={() => handleDeleteSubtask(subtask.id)}
                  className="opacity-0 group-hover:opacity-100 btn btn-ghost btn-icon text-[var(--text-tertiary)] hover:text-[var(--danger)]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
              placeholder="Adicionar subtarefa..."
              className="input flex-1"
            />
            <button
              onClick={handleAddSubtask}
              disabled={!newSubtaskTitle.trim() || addingSubtask}
              className="btn btn-secondary"
            >
              {addingSubtask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Attachments */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
            <Paperclip className="w-4 h-4" />
            Anexos
          </label>

          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface)] flex items-center justify-center">
                  <Paperclip className="w-5 h-5 text-[var(--text-tertiary)]" />
                </div>
                <span className="flex-1 text-sm text-[var(--text-primary)] truncate">
                  {attachment.file_name}
                </span>
                <a
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-icon text-[var(--text-tertiary)] hover:text-[var(--accent)]"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDeleteAttachment(attachment.id)}
                  className="opacity-0 group-hover:opacity-100 btn btn-ghost btn-icon text-[var(--text-tertiary)] hover:text-[var(--danger)]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <label className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-[var(--border-default)] rounded-xl cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)] transition-all group">
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface)] group-hover:bg-[var(--accent-muted)] flex items-center justify-center transition-colors">
                  <Upload className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--accent)]" />
                </div>
                <span className="text-sm text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]">
                  Clique para anexar arquivo
                </span>
              </>
            )}
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>
    </Modal>
  )
}
