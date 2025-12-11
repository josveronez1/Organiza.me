import { forwardRef } from 'react'
import { Task } from '../../types'
import { Calendar } from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TaskCardProps extends React.HTMLAttributes<HTMLDivElement> {
  task: Task
  onClick?: () => void
  isDragging?: boolean
}

export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
  ({ task, onClick, isDragging = false, className = '', ...props }, ref) => {
    const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))
    const isDueToday = task.due_date && isToday(new Date(task.due_date))

    const hasMeta = task.due_date || (task.tags && task.tags.length > 0)

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`task-card ${isDragging ? 'dragging' : ''} ${className}`.trim()}
        {...props}
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
)

TaskCard.displayName = 'TaskCard'
