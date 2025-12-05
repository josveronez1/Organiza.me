import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task } from '../../types'
import { Calendar } from 'lucide-react'
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

  const hasMeta = task.due_date || (task.tags && task.tags.length > 0)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`task-card ${isSortableDragging || isDragging ? 'dragging' : ''}`}
    >
      {/* Title */}
      <div className="task-card-title">{task.title}</div>

      {/* Meta: Tags + Date */}
      {hasMeta && (
        <div className="task-card-meta" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <>
              {task.tags.slice(0, 3).map((tag) => (
                <span 
                  key={tag.id} 
                  className="tag"
                  style={{ 
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                    fontSize: 11,
                    padding: '2px 6px'
                  }}
                >
                  {tag.name}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="tag tag-gray" style={{ fontSize: 11, padding: '2px 6px' }}>
                  +{task.tags.length - 3}
                </span>
              )}
            </>
          )}

          {/* Date */}
          {task.due_date && (
            <div className={`task-card-date ${isOverdue ? 'overdue' : ''} ${isDueToday ? 'today' : ''}`}>
              <Calendar size={12} />
              <span>{format(new Date(task.due_date), 'dd MMM', { locale: ptBR })}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
