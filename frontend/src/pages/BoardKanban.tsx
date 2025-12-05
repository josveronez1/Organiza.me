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
import { ArrowLeft, LayoutGrid, Plus, Loader2 } from 'lucide-react'
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
  const [newStageColor, setNewStageColor] = useState('#2383E2')
  const [savingNewStage, setSavingNewStage] = useState(false)
  const [deleteStageId, setDeleteStageId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
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

    // Find source stage
    let sourceStageId: number | null = null
    for (const [stageId, tasks] of Object.entries(tasksByStage)) {
      if (tasks.find(t => t.id === activeId)) {
        sourceStageId = Number(stageId)
        break
      }
    }

    // Find target stage and position
    let targetStageId: number | null = null
    let targetIndex: number = -1
    
    if (typeof overId === 'string' && overId.startsWith('stage-')) {
      // Dropping on empty column
      targetStageId = Number(overId.replace('stage-', ''))
      targetIndex = 0
    } else {
      // Dropping on another task
      for (const [stageId, tasks] of Object.entries(tasksByStage)) {
        const taskIndex = tasks.findIndex(t => t.id === overId)
        if (taskIndex !== -1) {
          targetStageId = Number(stageId)
          targetIndex = taskIndex
          break
        }
      }
    }

    if (!sourceStageId || !targetStageId) return

    // Moving within same column is handled by SortableContext
    if (sourceStageId === targetStageId) return

    setTasksByStage(prev => {
      const sourceTasks = [...(prev[sourceStageId!] || [])]
      const targetTasks = [...(prev[targetStageId!] || [])]
      
      const taskIndex = sourceTasks.findIndex(t => t.id === activeId)
      if (taskIndex === -1) return prev

      const [task] = sourceTasks.splice(taskIndex, 1)
      
      // Insert at the target position instead of appending
      if (targetIndex === -1 || targetIndex >= targetTasks.length) {
        targetTasks.push({ ...task, stage_id: targetStageId! })
      } else {
        targetTasks.splice(targetIndex, 0, { ...task, stage_id: targetStageId! })
      }

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

    // Find current stage and tasks for the active item
    let stageId: number | null = null
    let tasks: Task[] = []
    
    for (const [sid, stageTasks] of Object.entries(tasksByStage)) {
      if (stageTasks.find(t => t.id === activeId)) {
        stageId = Number(sid)
        tasks = [...stageTasks]
        break
      }
    }

    if (!stageId) return

    // Handle reordering within the same column
    if (typeof overId === 'number' && activeId !== overId) {
      const oldIndex = tasks.findIndex(t => t.id === activeId)
      const newIndex = tasks.findIndex(t => t.id === overId)

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
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
      // Task moved to a different column (already handled in dragOver)
      // Just persist the final position
      const finalIndex = tasks.findIndex(t => t.id === activeId)
      
      try {
        await tasksApi.move(activeId, {
          stage_id: stageId,
          position: finalIndex >= 0 ? finalIndex : 0,
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
            title="Board nao encontrado"
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban">
            {stages.map((stage, index) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                stageName={formatStageName(stage.name)}
                tasks={tasksByStage[stage.id] || []}
                color={stage.color || stageColors[index % stageColors.length]}
                onTaskClick={handleTaskClick}
                onAddTask={() => handleNewTask(stage.id)}
                onDeleteStage={() => setDeleteStageId(stage.id)}
              />
            ))}

            {/* Add Column - Single button, positioned as last column */}
            <button onClick={() => setIsNewStageModalOpen(true)} className="kanban-add-column">
              <Plus size={20} />
              <span>Nova Coluna</span>
            </button>
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* New Task Modal */}
      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        title="Nova Tarefa"
      >
        <form onSubmit={handleCreateTask}>
          <div style={{ marginBottom: 24 }}>
            <label className="input-label">Titulo</label>
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

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsNewTaskModalOpen(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={savingNewTask} className="btn btn-primary">
              {savingNewTask ? <Loader2 size={16} className="spinner" /> : 'Criar'}
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
        <form onSubmit={handleCreateStage}>
          <div style={{ marginBottom: 16 }}>
            <label className="input-label">Nome</label>
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
        message="Tem certeza que deseja excluir esta coluna? Todas as tarefas dentro dela serao perdidas."
        confirmText="Excluir"
        variant="danger"
      />
    </Layout>
  )
}
