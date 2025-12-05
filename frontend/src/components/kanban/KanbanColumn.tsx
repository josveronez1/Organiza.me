import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskCard } from './TaskCard'
import { Stage, Task } from '../../types'
import { Plus, MoreHorizontal, Trash2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface KanbanColumnProps {
  stage: Stage
  stageName: string
  tasks: Task[]
  color: string
  onTaskClick: (task: Task) => void
  onAddTask: () => void
  onDeleteStage: () => void
}

export function KanbanColumn({ 
  stage, 
  stageName, 
  tasks, 
  color, 
  onTaskClick, 
  onAddTask, 
  onDeleteStage 
}: KanbanColumnProps) {
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
      className="kanban-column"
      style={{ 
        borderColor: isOver ? color : undefined,
        borderWidth: isOver ? '2px' : '1px',
        borderStyle: 'solid'
      }}
    >
      {/* Column Header */}
      <div className="kanban-column-header">
        <div className="kanban-column-title">
          <div 
            style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: color 
            }} 
          />
          <span className="kanban-column-name">{stageName}</span>
          <span className="kanban-column-count">{tasks.length}</span>
        </div>
        
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {/* Add Task Button - Visible in header */}
          <button
            onClick={onAddTask}
            className="btn btn-ghost btn-icon-sm"
            title="Adicionar tarefa"
          >
            <Plus size={16} />
          </button>

          {/* Menu */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="btn btn-ghost btn-icon-sm"
            >
              <MoreHorizontal size={16} />
            </button>

            {showMenu && (
              <div className="dropdown fade-in" style={{ right: 0, top: '100%', marginTop: 4 }}>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onDeleteStage()
                  }}
                  className="dropdown-item dropdown-item-danger"
                >
                  <Trash2 className="dropdown-item-icon" />
                  Excluir coluna
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tasks Container */}
      <div ref={setNodeRef} className="kanban-column-body">
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
          <div className="kanban-empty">
            Arraste tarefas aqui
          </div>
        )}
      </div>

      {/* Footer - Secondary add button */}
      <div className="kanban-column-footer">
        <button onClick={onAddTask} className="kanban-add-task">
          <Plus size={14} />
          Adicionar tarefa
        </button>
      </div>
    </div>
  )
}
