import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskCard } from './TaskCard'
import { Stage, Task } from '../../types'
import { Plus, MoreHorizontal, Trash2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface KanbanColumnProps {
  stage: Stage
  tasks: Task[]
  color: string
  onTaskClick: (task: Task) => void
  onAddTask: () => void
  onDeleteStage: () => void
}

export function KanbanColumn({ stage, tasks, color, onTaskClick, onAddTask, onDeleteStage }: KanbanColumnProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.id}`,
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  return (
    <div 
      className={`
        flex-shrink-0 w-80 flex flex-col 
        bg-[var(--bg-raised)] 
        rounded-xl 
        border border-[var(--border-subtle)]
        transition-all duration-200
        ${isOver ? 'border-[var(--accent)] bg-[var(--bg-elevated)] shadow-lg shadow-[var(--accent-muted)]' : ''}
      `}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div 
            className="w-3 h-3 rounded-full shadow-sm" 
            style={{ 
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}50`
            }}
          />
          <h3 className="font-medium text-[var(--text-primary)] text-sm tracking-tight">
            {stage.name}
          </h3>
          <span className="badge">
            {tasks.length}
          </span>
        </div>
        
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="btn btn-ghost btn-icon opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
            style={{ opacity: showMenu ? 1 : undefined }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 dropdown-menu z-50 animate-fade-in-scale">
              <button
                onClick={() => {
                  setShowMenu(false)
                  onDeleteStage()
                }}
                className="dropdown-item dropdown-item-danger"
              >
                <Trash2 className="w-4 h-4" />
                Excluir coluna
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tasks Container */}
      <div 
        ref={setNodeRef}
        className="flex-1 p-3 overflow-y-auto min-h-[200px] space-y-2.5"
      >
        <SortableContext 
          items={tasks.map(t => t.id)} 
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="h-28 flex flex-col items-center justify-center text-center rounded-xl border-2 border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)]/50 transition-colors">
            <p className="text-sm text-[var(--text-quaternary)]">
              Arraste tasks aqui
            </p>
          </div>
        )}
      </div>

      {/* Add Task Button */}
      <div className="p-3 border-t border-[var(--border-subtle)]">
        <button
          onClick={onAddTask}
          className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] border border-transparent hover:border-[var(--border-default)] transition-all duration-200 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center justify-center gap-2 text-sm font-medium group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
          Adicionar Task
        </button>
      </div>
    </div>
  )
}
