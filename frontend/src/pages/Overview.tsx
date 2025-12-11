import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
import { overviewApi, stagesApi, tasksApi } from '../lib/api'
import { OverviewTask, OverviewPeriod, Stage } from '../types'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  LayoutGrid,
  FolderOpen,
  Clock,
  ChevronDown,
  Check,
  Loader2
} from 'lucide-react'
import { format, addDays, addWeeks, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Helper to format stage names (a_fazer -> A Fazer)
function formatStageName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

// Grouped structure for display
interface GroupedTasks {
  [workspaceId: number]: {
    workspace_name: string
    boards: {
      [boardId: number]: {
        board_name: string
        tasks: OverviewTask[]
        tasksWithoutDate: OverviewTask[]
      }
    }
  }
}

export function Overview() {
  const [tasks, setTasks] = useState<OverviewTask[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<OverviewPeriod>('week')
  const [refDate, setRefDate] = useState(new Date())
  
  // Stage selector state
  const [stagesByBoard, setStagesByBoard] = useState<Record<number, Stage[]>>({})
  const [openStageSelector, setOpenStageSelector] = useState<number | null>(null)
  const [movingTaskId, setMovingTaskId] = useState<number | null>(null)
  const dropdownRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({})
  const [dropdownPositions, setDropdownPositions] = useState<Record<number, { top: number; right: number }>>({})

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isClickInside = Object.values(dropdownRefs.current).some(
        ref => ref && ref.contains(target)
      )
      if (!isClickInside) {
        setOpenStageSelector(null)
      }
    }

    if (openStageSelector !== null) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [openStageSelector])

  const loadTasks = useCallback(async () => {
    setLoading(true)
    try {
      const response = await overviewApi.list({
        period,
        ref_date: format(refDate, 'yyyy-MM-dd'),
      })
      setTasks(response.data)
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
    } finally {
      setLoading(false)
    }
  }, [period, refDate])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Load stages for a board when opening the selector
  const loadStagesForBoard = async (boardId: number) => {
    if (stagesByBoard[boardId]) return // Already loaded
    
    try {
      const response = await stagesApi.list(boardId)
      setStagesByBoard(prev => ({
        ...prev,
        [boardId]: response.data,
      }))
    } catch (error) {
      console.error('Erro ao carregar stages:', error)
    }
  }

  const handleOpenStageSelector = async (taskId: number, boardId: number) => {
    if (openStageSelector === taskId) {
      setOpenStageSelector(null)
      return
    }
    await loadStagesForBoard(boardId)
    
    // Calculate dropdown position
    const button = buttonRefs.current[taskId]
    if (button) {
      const rect = button.getBoundingClientRect()
      setDropdownPositions(prev => ({
        ...prev,
        [taskId]: {
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right,
        }
      }))
    }
    
    setOpenStageSelector(taskId)
  }

  const handleMoveTask = async (taskId: number, newStageId: number) => {
    setMovingTaskId(taskId)
    try {
      await tasksApi.move(taskId, { stage_id: newStageId, position: 0 })
      await loadTasks()
    } catch (error) {
      console.error('Erro ao mover tarefa:', error)
    } finally {
      setMovingTaskId(null)
      setOpenStageSelector(null)
    }
  }

  // Navigation functions
  const navigatePrev = () => {
    switch (period) {
      case 'day':
        setRefDate(prev => addDays(prev, -1))
        break
      case 'week':
        setRefDate(prev => addWeeks(prev, -1))
        break
      case 'month':
        setRefDate(prev => addMonths(prev, -1))
        break
    }
  }

  const navigateNext = () => {
    switch (period) {
      case 'day':
        setRefDate(prev => addDays(prev, 1))
        break
      case 'week':
        setRefDate(prev => addWeeks(prev, 1))
        break
      case 'month':
        setRefDate(prev => addMonths(prev, 1))
        break
    }
  }

  const goToToday = () => {
    setRefDate(new Date())
  }

  // Format date range for display
  const getDateRangeLabel = () => {
    switch (period) {
      case 'day':
        return format(refDate, "d 'de' MMMM, yyyy", { locale: ptBR })
      case 'week': {
        const start = startOfWeek(refDate, { weekStartsOn: 0 })
        const end = endOfWeek(refDate, { weekStartsOn: 0 })
        if (start.getMonth() === end.getMonth()) {
          return `${format(start, 'd')} - ${format(end, "d 'de' MMMM", { locale: ptBR })}`
        }
        return `${format(start, "d 'de' MMM", { locale: ptBR })} - ${format(end, "d 'de' MMM", { locale: ptBR })}`
      }
      case 'month':
        return format(refDate, "MMMM 'de' yyyy", { locale: ptBR })
    }
  }

  // Group tasks by workspace and board
  const groupedTasks: GroupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.workspace_id]) {
      acc[task.workspace_id] = {
        workspace_name: task.workspace_name,
        boards: {},
      }
    }
    
    if (!acc[task.workspace_id].boards[task.board_id]) {
      acc[task.workspace_id].boards[task.board_id] = {
        board_name: task.board_name,
        tasks: [],
        tasksWithoutDate: [],
      }
    }
    
    if (task.due_date === null) {
      acc[task.workspace_id].boards[task.board_id].tasksWithoutDate.push(task)
    } else {
      acc[task.workspace_id].boards[task.board_id].tasks.push(task)
    }
    
    return acc
  }, {} as GroupedTasks)

  const hasNoTasks = Object.keys(groupedTasks).length === 0

  // Get stage color based on position/name
  const getStageColor = (stageName: string): string => {
    const name = stageName.toLowerCase()
    if (name.includes('fazer') || name.includes('todo') || name.includes('backlog')) {
      return 'var(--tag-gray-text)'
    }
    if (name.includes('fazendo') || name.includes('progress') || name.includes('doing')) {
      return 'var(--tag-blue-text)'
    }
    if (name.includes('conclu') || name.includes('done') || name.includes('feito')) {
      return 'var(--tag-green-text)'
    }
    return 'var(--text-secondary)'
  }

  const getStageBackground = (stageName: string): string => {
    const name = stageName.toLowerCase()
    if (name.includes('fazer') || name.includes('todo') || name.includes('backlog')) {
      return 'var(--tag-gray)'
    }
    if (name.includes('fazendo') || name.includes('progress') || name.includes('doing')) {
      return 'var(--tag-blue)'
    }
    if (name.includes('conclu') || name.includes('done') || name.includes('feito')) {
      return 'var(--tag-green)'
    }
    return 'var(--bg-hover)'
  }

  return (
    <Layout>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-actions">
            <div>
              <h1 className="page-title">Visão Geral</h1>
              <p className="page-description">Todas as suas tarefas em um só lugar</p>
            </div>
          </div>
        </div>

        {/* Period Controls */}
        <div className="overview-controls">
          {/* Period Selector */}
          <div className="overview-period-selector">
            <button
              onClick={() => setPeriod('day')}
              className={`overview-period-btn ${period === 'day' ? 'active' : ''}`}
            >
              Dia
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`overview-period-btn ${period === 'week' ? 'active' : ''}`}
            >
              Semana
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`overview-period-btn ${period === 'month' ? 'active' : ''}`}
            >
              Mês
            </button>
          </div>

          {/* Date Navigation */}
          <div className="overview-date-nav">
            <button onClick={navigatePrev} className="btn btn-ghost btn-icon">
              <ChevronLeft size={18} />
            </button>
            
            <button onClick={goToToday} className="overview-date-label">
              <Calendar size={14} />
              <span>{getDateRangeLabel()}</span>
            </button>
            
            <button onClick={navigateNext} className="btn btn-ghost btn-icon">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-container">
            <Loading />
          </div>
        ) : hasNoTasks ? (
          <EmptyState
            icon={<Calendar size={32} />}
            title="Nenhuma tarefa encontrada"
            description={`Não há tarefas para ${period === 'day' ? 'este dia' : period === 'week' ? 'esta semana' : 'este mês'}.`}
          />
        ) : (
          <div className="overview-content">
            {Object.entries(groupedTasks).map(([workspaceId, workspace]) => (
              <div key={workspaceId} className="overview-workspace">
                {/* Workspace Header */}
                <div className="overview-workspace-header">
                  <FolderOpen size={16} />
                  <span>{workspace.workspace_name}</span>
                </div>

                {/* Boards */}
                <div className="overview-boards">
                  {Object.entries(workspace.boards).map(([boardId, board]) => (
                    <div key={boardId} className="overview-board">
                      {/* Board Header */}
                      <Link 
                        to={`/board/${boardId}`} 
                        className="overview-board-header"
                      >
                        <LayoutGrid size={14} />
                        <span>{board.board_name}</span>
                        <span className="overview-board-count">
                          {board.tasks.length + board.tasksWithoutDate.length}
                        </span>
                      </Link>

                      {/* Tasks with due date */}
                      <div className="overview-tasks">
                        {board.tasks.map((task) => (
                          <div key={task.id} className="overview-task">
                            <div className="overview-task-info">
                              <span className="overview-task-title">{task.title}</span>
                              {task.due_date && (
                                <span className="overview-task-date">
                                  <Clock size={12} />
                                  {format(new Date(task.due_date), 'dd/MM')}
                                </span>
                              )}
                            </div>
                            
                            {/* Stage Selector */}
                            <div className="overview-stage-wrapper" style={{ position: 'relative' }}>
                              <button
                                ref={(el) => { buttonRefs.current[task.id] = el }}
                                onClick={() => handleOpenStageSelector(task.id, task.board_id)}
                                className="overview-stage-btn"
                                style={{ 
                                  backgroundColor: getStageBackground(task.stage_name),
                                  color: getStageColor(task.stage_name)
                                }}
                                disabled={movingTaskId === task.id}
                              >
                                {movingTaskId === task.id ? (
                                  <Loader2 size={12} className="spinner" />
                                ) : (
                                  <>
                                    <span>{formatStageName(task.stage_name)}</span>
                                    <ChevronDown size={12} />
                                  </>
                                )}
                              </button>

                              {openStageSelector === task.id && stagesByBoard[task.board_id] && dropdownPositions[task.id] && (
                                <div 
                                  ref={(el) => { dropdownRefs.current[task.id] = el }}
                                  className="dropdown fade-in overview-stage-dropdown" 
                                  style={{ 
                                    position: 'fixed',
                                    top: `${dropdownPositions[task.id].top}px`,
                                    right: `${dropdownPositions[task.id].right}px`,
                                    zIndex: 9999,
                                    minWidth: 160
                                  }}
                                >
                                  {stagesByBoard[task.board_id].map((stage) => (
                                    <button
                                      key={stage.id}
                                      onClick={() => handleMoveTask(task.id, stage.id)}
                                      className={`dropdown-item ${stage.id === task.stage_id ? 'active' : ''}`}
                                    >
                                      <div 
                                        className="overview-stage-dot"
                                        style={{ backgroundColor: stage.color || 'var(--text-tertiary)' }}
                                      />
                                      <span>{formatStageName(stage.name)}</span>
                                      {stage.id === task.stage_id && (
                                        <Check size={14} style={{ marginLeft: 'auto' }} />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Tasks without due date */}
                        {board.tasksWithoutDate.length > 0 && (
                          <>
                            <div className="overview-section-divider">
                              <span>Sem data definida</span>
                            </div>
                            {board.tasksWithoutDate.map((task) => (
                              <div key={task.id} className="overview-task overview-task-no-date">
                                <div className="overview-task-info">
                                  <span className="overview-task-title">{task.title}</span>
                                </div>
                                
                            {/* Stage Selector */}
                            <div className="overview-stage-wrapper" style={{ position: 'relative' }}>
                              <button
                                ref={(el) => { buttonRefs.current[task.id] = el }}
                                onClick={() => handleOpenStageSelector(task.id, task.board_id)}
                                className="overview-stage-btn"
                                style={{ 
                                  backgroundColor: getStageBackground(task.stage_name),
                                  color: getStageColor(task.stage_name)
                                }}
                                disabled={movingTaskId === task.id}
                              >
                                {movingTaskId === task.id ? (
                                  <Loader2 size={12} className="spinner" />
                                ) : (
                                  <>
                                    <span>{formatStageName(task.stage_name)}</span>
                                    <ChevronDown size={12} />
                                  </>
                                )}
                              </button>

                                  {openStageSelector === task.id && stagesByBoard[task.board_id] && dropdownPositions[task.id] && (
                                    <div 
                                      ref={(el) => { dropdownRefs.current[task.id] = el }}
                                      className="dropdown fade-in overview-stage-dropdown" 
                                      style={{ 
                                        position: 'fixed',
                                        top: `${dropdownPositions[task.id].top}px`,
                                        right: `${dropdownPositions[task.id].right}px`,
                                        zIndex: 9999,
                                        minWidth: 160
                                      }}
                                    >
                                      {stagesByBoard[task.board_id].map((stage) => (
                                        <button
                                          key={stage.id}
                                          onClick={() => handleMoveTask(task.id, stage.id)}
                                          className={`dropdown-item ${stage.id === task.stage_id ? 'active' : ''}`}
                                        >
                                          <div 
                                            className="overview-stage-dot"
                                            style={{ backgroundColor: stage.color || 'var(--text-tertiary)' }}
                                          />
                                          <span>{formatStageName(stage.name)}</span>
                                          {stage.id === task.stage_id && (
                                            <Check size={14} style={{ marginLeft: 'auto' }} />
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

