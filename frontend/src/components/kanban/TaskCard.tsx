import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task } from '../../types'
import { Calendar, MessageSquare, Paperclip, CheckSquare } from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TaskCardProps {
  task: Task
  onClick?: () => void
  isDragging?: boolean
}

export function TaskCard({ task, onClick, isDragging = false }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))
  const isDueToday = task.due_date && isToday(new Date(task.due_date))

  const draggingStyles = isSortableDragging || isDragging 
    ? 'opacity-90 rotate-[2deg] scale-[1.02] shadow-xl ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-base)]' 
    : ''

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        group relative
        bg-[var(--bg-elevated)] 
        border border-[var(--border-subtle)]
        rounded-xl 
        p-4
        cursor-pointer 
        select-none
        transition-all duration-200
        hover:border-[var(--border-default)]
        hover:bg-[var(--bg-surface)]
        hover:shadow-md
        active:scale-[0.98]
        ${draggingStyles}
      `}
    >
      {/* Accent line on hover */}
      <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-[var(--accent)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className={`tag tag-${tag.color}`}
            >
              {tag.name}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="tag tag-gray">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <h4 className="text-sm font-medium text-[var(--text-primary)] leading-snug mb-2 truncate-2 group-hover:text-[var(--accent)] transition-colors">
        {task.title}
      </h4>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-[var(--text-tertiary)] truncate-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer with metadata */}
      <div className="flex items-center gap-3 text-xs">
        {/* Due Date */}
        {task.due_date && (
          <div 
            className={`
              flex items-center gap-1.5 px-2 py-1 rounded-md
              ${isOverdue 
                ? 'bg-[var(--danger-muted)] text-[var(--danger)]' 
                : isDueToday 
                  ? 'bg-[var(--warning-muted)] text-[var(--warning)]' 
                  : 'text-[var(--text-tertiary)]'
              }
            `}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-medium">
              {format(new Date(task.due_date), 'dd MMM', { locale: ptBR })}
            </span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Comments indicator (visual) */}
        {task.description && (
          <div className="flex items-center gap-1 text-[var(--text-quaternary)]">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  )
}
