import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
import { TaskCard } from '../components/kanban/TaskCard'
import { TaskModal } from '../components/kanban/TaskModal'
import { NewTaskModal } from '../components/kanban/NewTaskModal'
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanOverlay,
  KanbanMoveEvent,
} from '../components/kanban/Kanban'
import { boardsApi, stagesApi, tasksApi } from '../lib/api'
import { Board, Stage, Task } from '../types'
import { ArrowLeft, LayoutGrid, Plus, Loader2, MoreHorizontal, Trash2 } from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'

// Helper to format stage names (a_fazer -> A Fazer)
function formatStageName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function BoardKanban() {
  const { boardId } = useParams<{ boardId: string }>()
  const [board, setBoard] = useState<Board | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [tasksByStage, setTasksByStage] = useState<Record<string, Task[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false)
  const [newTaskStageId, setNewTaskStageId] = useState<number | null>(null)
  const [isNewStageModalOpen, setIsNewStageModalOpen] = useState(false)
  const [newStageName, setNewStageName] = useState('')
  const [newStageColor, setNewStageColor] = useState('#2383E2')
  const [savingNewStage, setSavingNewStage] = useState(false)
  const [deleteStageId, setDeleteStageId] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [boardId])

  const loadData = async () => {
    if (!boardId) return

    try {
      const [boardRes, stagesRes] = await Promise.all([
        boardsApi.get(Number(boardId)),
        stagesApi.list(Number(boardId))
      ])
      
      setBoard(boardRes.data)
      setStages(stagesRes.data.sort((a, b) => a.position - b.position))

      const tasksMap: Record<string, Task[]> = {}
      await Promise.all(
        stagesRes.data.map(async (stage: Stage) => {
          const tasksRes = await tasksApi.list(stage.id)
          tasksMap[String(stage.id)] = tasksRes.data.sort((a, b) => a.position - b.position)
        })
      )
      setTasksByStage(tasksMap)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMove = async (event: KanbanMoveEvent) => {
    const { activeContainer, activeIndex, overContainer, overIndex } = event
    
    const taskId = Number(event.event.active.id)
    const newStageId = Number(overContainer)
    
    // Salvar estado atual para possível rollback
    const previousState = { ...tasksByStage }
    
    // Fazer requisição ao backend em background
    // O estado já foi atualizado otimisticamente via onValueChange
    try {
      await tasksApi.move(taskId, {
        stage_id: newStageId,
        position: overIndex,
      })
    } catch (error) {
      console.error('Erro ao mover task:', error)
      // Reverter para estado anterior em caso de erro
      setTasksByStage(previousState)
      // Recarregar dados do servidor para garantir sincronização
      await loadData()
    }
  }

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task)
    setIsTaskModalOpen(true)
  }, [])

  const handleNewTask = (stageId: number) => {
    setNewTaskStageId(stageId)
    setIsNewTaskModalOpen(true)
  }

  const handleCreateTask = async (taskData: { title: string; description?: string; stage_id: number; position: number; start_date?: string; due_date?: string }) => {
    try {
      const tasks = tasksByStage[String(taskData.stage_id)] || []
      const response = await tasksApi.create({
        ...taskData,
        position: tasks.length,
      })
      // Recarregar dados para ter o ID da task criada
      await loadData()
      setIsNewTaskModalOpen(false)
      setNewTaskStageId(null)
    } catch (error) {
      console.error('Erro ao criar task:', error)
    }
  }

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!boardId || !newStageName.trim()) return

    setSavingNewStage(true)
    try {
      await stagesApi.create({
        name: newStageName.trim(),
        board_id: Number(boardId),
        position: stages.length,
        color: newStageColor,
      })
      await loadData()
      setIsNewStageModalOpen(false)
      setNewStageName('')
    } catch (error) {
      console.error('Erro ao criar stage:', error)
    } finally {
      setSavingNewStage(false)
    }
  }

  const handleTaskUpdate = useCallback(async () => {
    await loadData()
    setIsTaskModalOpen(false)
    setSelectedTask(null)
  }, [])

  const handleDeleteStage = async (stageId: number) => {
    try {
      await stagesApi.delete(stageId)
      await loadData()
    } catch (error) {
      console.error('Erro ao excluir stage:', error)
    }
    setDeleteStageId(null)
  }

  const stageColors = ['#2383E2', '#4DAB9A', '#CB912F', '#E03E3E', '#9065B0', '#C14C8A']

  if (loading) {
    return (
      <Layout>
        <div className="loading-page">
          <Loading />
        </div>
      </Layout>
    )
  }

  if (!board) {
    return (
      <Layout>
        <div className="page-container">
          <EmptyState
            icon={<LayoutGrid size={32} />}
            title="Board não encontrado"
            action={<Link to="/" className="btn btn-primary">Voltar</Link>}
          />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="page-container-full">
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Link to={`/workspace/${board.workspace_id}`} className="page-back">
            <ArrowLeft className="page-back-icon" />
            Voltar
          </Link>
          
          <h1 className="page-title" style={{ fontSize: 24 }}>{board.name}</h1>
        </div>

        {/* Kanban Board */}
        <Kanban
          value={tasksByStage}
          onValueChange={(newValue) => {
            // Update otimista - atualizar imediatamente durante o drag
            setTasksByStage(newValue)
          }}
          getItemValue={(task) => String(task.id)}
          onMove={handleMove}
        >
          <KanbanBoard>
            {stages.map((stage, index) => {
              const stageId = String(stage.id)
              const tasks = tasksByStage[stageId] || []
              const color = stage.color || stageColors[index % stageColors.length]
              
              return (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  stageName={formatStageName(stage.name)}
                  tasks={tasks}
                  color={color}
                  onTaskClick={handleTaskClick}
                  onAddTask={() => handleNewTask(stage.id)}
                  onDeleteStage={() => setDeleteStageId(stage.id)}
                />
              )
            })}

            {/* Add Column */}
            <button onClick={() => setIsNewStageModalOpen(true)} className="kanban-add-column">
              <Plus size={20} />
              <span>Nova Coluna</span>
            </button>
          </KanbanBoard>

          <KanbanOverlay>
            {({ value, variant }) => {
              if (variant === 'item') {
                const taskId = Number(value)
                // Find task in any stage
                for (const tasks of Object.values(tasksByStage)) {
                  const task = tasks.find(t => t.id === taskId)
                  if (task) {
                    return <TaskCard task={task} isDragging />
                  }
                }
              }
              return null
            }}
          </KanbanOverlay>
        </Kanban>
      </div>

      {/* New Task Modal - Using TaskModal for full experience */}
      {isNewTaskModalOpen && newTaskStageId && (
        <NewTaskModal
          isOpen={isNewTaskModalOpen}
          onClose={() => {
            setIsNewTaskModalOpen(false)
            setNewTaskStageId(null)
          }}
          stageId={newTaskStageId}
          workspaceId={board.workspace_id}
          onCreate={handleCreateTask}
          onUpdate={handleTaskUpdate}
        />
      )}

      {/* New Stage Modal */}
      <Modal
        isOpen={isNewStageModalOpen}
        onClose={() => setIsNewStageModalOpen(false)}
        title="Nova Coluna"
      >
        <form onSubmit={handleCreateStage}>
          <div style={{ marginBottom: 16 }}>
            <label className="input-label">Nome</label>
            <input
              type="text"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              className="input"
              placeholder="Ex: Em Revisão, Bloqueado..."
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="input-label">Cor</label>
            <div className="color-picker">
              {stageColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewStageColor(color)}
                  className={`color-option ${newStageColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsNewStageModalOpen(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={savingNewStage} className="btn btn-primary">
              {savingNewStage ? <Loader2 size={16} className="spinner" /> : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false)
            setSelectedTask(null)
          }}
          task={selectedTask}
          workspaceId={board.workspace_id}
          onUpdate={handleTaskUpdate}
        />
      )}

      {/* Confirm Delete Stage Modal */}
      <ConfirmModal
        isOpen={deleteStageId !== null}
        onClose={() => setDeleteStageId(null)}
        onConfirm={() => deleteStageId && handleDeleteStage(deleteStageId)}
        title="Excluir coluna"
        message="Tem certeza que deseja excluir esta coluna? Todas as tarefas dentro dela serão perdidas."
        confirmText="Excluir"
        variant="danger"
      />
    </Layout>
  )
}

// Stage Column Component using new Kanban structure
interface StageColumnProps {
  stage: Stage
  stageName: string
  tasks: Task[]
  color: string
  onTaskClick: (task: Task) => void
  onAddTask: () => void
  onDeleteStage: () => void
}

function StageColumn({ stage, stageName, tasks, color, onTaskClick, onAddTask, onDeleteStage }: StageColumnProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const stageId = String(stage.id)

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
    <KanbanColumn
      value={stageId}
      className="kanban-column"
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
          {/* Add Task Button */}
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
      <div>
        <KanbanColumnContent value={stageId}>
          {tasks.map((task) => (
            <KanbanItem key={task.id} value={String(task.id)} className="task-card-wrapper">
              <TaskCard 
                task={task} 
                onClick={() => onTaskClick(task)}
              />
            </KanbanItem>
          ))}

          {tasks.length === 0 && (
            <div className="kanban-empty">
              Arraste tarefas aqui
            </div>
          )}
        </KanbanColumnContent>
      </div>

      {/* Footer - Secondary add button */}
      <div className="kanban-column-footer">
        <button onClick={onAddTask} className="kanban-add-task">
          <Plus size={14} />
          Adicionar tarefa
        </button>
      </div>
    </KanbanColumn>
  )
}
