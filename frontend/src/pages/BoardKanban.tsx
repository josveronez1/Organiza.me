import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Layout } from '../components/layout/Layout'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
import { KanbanColumn } from '../components/kanban/KanbanColumn'
import { TaskCard } from '../components/kanban/TaskCard'
import { TaskModal } from '../components/kanban/TaskModal'
import { boardsApi, stagesApi, tasksApi } from '../lib/api'
import { Board, Stage, Task } from '../types'
import { ArrowLeft, Columns3, Plus, Loader2, Palette } from 'lucide-react'
import { Modal } from '../components/ui/Modal'

export function BoardKanban() {
  const { boardId } = useParams<{ boardId: string }>()
  const [board, setBoard] = useState<Board | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [tasksByStage, setTasksByStage] = useState<Record<number, Task[]>>({})
  const [loading, setLoading] = useState(true)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false)
  const [newTaskStageId, setNewTaskStageId] = useState<number | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [savingNewTask, setSavingNewTask] = useState(false)
  const [isNewStageModalOpen, setIsNewStageModalOpen] = useState(false)
  const [newStageName, setNewStageName] = useState('')
  const [newStageColor, setNewStageColor] = useState('#22d3ee')
  const [savingNewStage, setSavingNewStage] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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
      setStages(stagesRes.data)

      const tasksMap: Record<number, Task[]> = {}
      await Promise.all(
        stagesRes.data.map(async (stage: Stage) => {
          const tasksRes = await tasksApi.list(stage.id)
          tasksMap[stage.id] = tasksRes.data
        })
      )
      setTasksByStage(tasksMap)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const taskId = active.id as number
    
    for (const tasks of Object.values(tasksByStage)) {
      const task = tasks.find(t => t.id === taskId)
      if (task) {
        setActiveTask(task)
        break
      }
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as number
    const overId = over.id

    let sourceStageId: number | null = null
    for (const [stageId, tasks] of Object.entries(tasksByStage)) {
      if (tasks.find(t => t.id === activeId)) {
        sourceStageId = Number(stageId)
        break
      }
    }

    let targetStageId: number | null = null
    
    if (typeof overId === 'string' && overId.startsWith('stage-')) {
      targetStageId = Number(overId.replace('stage-', ''))
    } else {
      for (const [stageId, tasks] of Object.entries(tasksByStage)) {
        if (tasks.find(t => t.id === overId)) {
          targetStageId = Number(stageId)
          break
        }
      }
    }

    if (!sourceStageId || !targetStageId || sourceStageId === targetStageId) return

    setTasksByStage(prev => {
      const sourceTasks = [...(prev[sourceStageId!] || [])]
      const targetTasks = [...(prev[targetStageId!] || [])]
      
      const taskIndex = sourceTasks.findIndex(t => t.id === activeId)
      if (taskIndex === -1) return prev

      const [task] = sourceTasks.splice(taskIndex, 1)
      targetTasks.push({ ...task, stage_id: targetStageId! })

      return {
        ...prev,
        [sourceStageId!]: sourceTasks,
        [targetStageId!]: targetTasks,
      }
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as number
    const overId = over.id

    let stageId: number | null = null
    let tasks: Task[] = []
    
    for (const [sid, stageTasks] of Object.entries(tasksByStage)) {
      if (stageTasks.find(t => t.id === activeId)) {
        stageId = Number(sid)
        tasks = stageTasks
        break
      }
    }

    if (!stageId) return

    if (typeof overId === 'number' && activeId !== overId) {
      const oldIndex = tasks.findIndex(t => t.id === activeId)
      const newIndex = tasks.findIndex(t => t.id === overId)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newTasks = arrayMove(tasks, oldIndex, newIndex)
        setTasksByStage(prev => ({
          ...prev,
          [stageId!]: newTasks,
        }))

        try {
          await tasksApi.move(activeId, {
            stage_id: stageId,
            position: newIndex,
          })
        } catch (error) {
          console.error('Erro ao mover task:', error)
          loadData()
        }
      }
    } else {
      const newIndex = tasks.findIndex(t => t.id === activeId)
      
      try {
        await tasksApi.move(activeId, {
          stage_id: stageId,
          position: newIndex,
        })
      } catch (error) {
        console.error('Erro ao mover task:', error)
        loadData()
      }
    }
  }

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task)
    setIsTaskModalOpen(true)
  }, [])

  const handleNewTask = (stageId: number) => {
    setNewTaskStageId(stageId)
    setNewTaskTitle('')
    setIsNewTaskModalOpen(true)
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskStageId || !newTaskTitle.trim()) return

    setSavingNewTask(true)
    try {
      const tasks = tasksByStage[newTaskStageId] || []
      await tasksApi.create({
        title: newTaskTitle.trim(),
        stage_id: newTaskStageId,
        position: tasks.length,
      })
      await loadData()
      setIsNewTaskModalOpen(false)
    } catch (error) {
      console.error('Erro ao criar task:', error)
    } finally {
      setSavingNewTask(false)
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
      setNewStageColor('#22d3ee')
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
    if (!confirm('Tem certeza que deseja excluir esta coluna? Todas as tasks serao excluidas.')) {
      return
    }

    try {
      await stagesApi.delete(stageId)
      await loadData()
    } catch (error) {
      console.error('Erro ao excluir stage:', error)
    }
  }

  // Premium color palette for stages
  const stageColors = [
    { color: '#22d3ee', name: 'Cyan' },
    { color: '#34d399', name: 'Emerald' },
    { color: '#fbbf24', name: 'Amber' },
    { color: '#f87171', name: 'Red' },
    { color: '#a78bfa', name: 'Violet' },
    { color: '#fb7185', name: 'Rose' },
    { color: '#60a5fa', name: 'Blue' },
    { color: '#4ade80', name: 'Green' },
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loading size="lg" text="Carregando board..." />
        </div>
      </Layout>
    )
  }

  if (!board) {
    return (
      <Layout>
        <div className="p-8">
          <EmptyState
            icon={<Columns3 className="w-7 h-7" />}
            title="Board nao encontrado"
            description="O board que voce esta procurando nao existe ou foi excluido."
            action={
              <Link to="/" className="btn btn-primary">
                Voltar ao Dashboard
              </Link>
            }
          />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Board Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-[var(--border-subtle)] bg-[var(--bg-raised)]">
          <Link 
            to={`/workspace/${board.workspace_id}`}
            className="inline-flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-3 transition-colors text-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Voltar aos Boards
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-cyan-400 flex items-center justify-center">
                <Columns3 className="w-5 h-5 text-[var(--bg-base)]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                  {board.name}
                </h1>
                {board.description && (
                  <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
                    {board.description}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsNewStageModalOpen(true)}
              className="btn btn-secondary"
            >
              <Plus className="w-4 h-4" />
              Nova Coluna
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto p-6 bg-gradient-subtle">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-5 h-full min-w-max stagger-children">
              {stages.map((stage, index) => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  tasks={tasksByStage[stage.id] || []}
                  color={stage.color || stageColors[index % stageColors.length].color}
                  onTaskClick={handleTaskClick}
                  onAddTask={() => handleNewTask(stage.id)}
                  onDeleteStage={() => handleDeleteStage(stage.id)}
                />
              ))}

              {/* Add Column Button */}
              <button
                onClick={() => setIsNewStageModalOpen(true)}
                className="flex-shrink-0 w-80 h-fit p-6 rounded-xl border-2 border-dashed border-[var(--border-default)] hover:border-[var(--accent)] bg-[var(--bg-raised)]/50 hover:bg-[var(--bg-elevated)] transition-all duration-300 group flex flex-col items-center justify-center gap-3 text-[var(--text-tertiary)] hover:text-[var(--accent)]"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] group-hover:bg-[var(--accent-muted)] flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                </div>
                <span className="font-medium">Adicionar Coluna</span>
              </button>
            </div>

            <DragOverlay>
              {activeTask ? (
                <TaskCard task={activeTask} isDragging />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* New Task Modal */}
      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        title="Nova Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Titulo
            </label>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="input"
              placeholder="O que precisa ser feito?"
              required
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setIsNewTaskModalOpen(false)} 
              className="btn btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button type="submit" disabled={savingNewTask} className="btn btn-primary flex-1">
              {savingNewTask ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* New Stage Modal */}
      <Modal
        isOpen={isNewStageModalOpen}
        onClose={() => setIsNewStageModalOpen(false)}
        title="Nova Coluna"
      >
        <form onSubmit={handleCreateStage} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Nome
            </label>
            <input
              type="text"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              className="input"
              placeholder="Ex: Em Revisao, Bloqueado..."
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
              <Palette className="w-4 h-4" />
              Cor
            </label>
            <div className="flex gap-2 flex-wrap">
              {stageColors.map(({ color, name }) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewStageColor(color)}
                  title={name}
                  className={`
                    w-10 h-10 rounded-xl transition-all duration-200
                    ${newStageColor === color 
                      ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-surface)]' 
                      : 'hover:scale-105'
                    }
                  `}
                  style={{ 
                    backgroundColor: color,
                    boxShadow: newStageColor === color ? `0 0 20px ${color}50` : undefined
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setIsNewStageModalOpen(false)} 
              className="btn btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button type="submit" disabled={savingNewStage} className="btn btn-primary flex-1">
              {savingNewStage ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Coluna'}
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
    </Layout>
  )
}
