import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
import { overviewApi } from '../lib/api'
import { OverviewTask } from '../types'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  LayoutGrid,
  FolderOpen
} from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function Calendar() {
  const [tasks, setTasks] = useState<OverviewTask[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    try {
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      
      // Buscar tarefas do mês usando o endpoint de overview
      const response = await overviewApi.list({
        period: 'month',
        ref_date: format(currentDate, 'yyyy-MM-dd'),
      })
      setTasks(response.data)
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Navegação do calendário
  const navigatePrev = () => {
    setCurrentDate(prev => subMonths(prev, 1))
  }

  const navigateNext = () => {
    setCurrentDate(prev => addMonths(prev, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(null)
  }

  // Gerar dias do calendário
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Agrupar tarefas por data
  const tasksByDate = tasks.reduce((acc, task) => {
    if (!task.due_date) return acc
    
    const taskDate = format(new Date(task.due_date), 'yyyy-MM-dd')
    if (!acc[taskDate]) {
      acc[taskDate] = []
    }
    acc[taskDate].push(task)
    return acc
  }, {} as Record<string, OverviewTask[]>)

  // Obter tarefas de uma data específica
  const getTasksForDate = (date: Date): OverviewTask[] => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return tasksByDate[dateKey] || []
  }

  // Verificar se é hoje
  const isToday = (date: Date) => isSameDay(date, new Date())

  // Verificar se é o mês atual
  const isCurrentMonth = (date: Date) => isSameMonth(date, currentDate)

  // Nomes dos dias da semana
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  // Obter tarefas da data selecionada
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : []

  return (
    <Layout>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-actions">
            <div>
              <h1 className="page-title">Calendário</h1>
              <p className="page-description">Visualize suas tarefas por data</p>
            </div>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="overview-controls">
          <div className="overview-date-nav">
            <button onClick={navigatePrev} className="btn btn-ghost btn-icon">
              <ChevronLeft size={18} />
            </button>
            
            <button onClick={goToToday} className="overview-date-label">
              <CalendarIcon size={14} />
              <span>{format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}</span>
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
        ) : (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            {/* Calendar Grid */}
            <div style={{ flex: 1 }}>
              <div className="calendar-grid">
                {/* Week Days Header */}
                <div className="calendar-weekdays">
                  {weekDays.map((day) => (
                    <div key={day} className="calendar-weekday">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="calendar-days">
                  {calendarDays.map((date) => {
                    const dayTasks = getTasksForDate(date)
                    const isSelected = selectedDate && isSameDay(date, selectedDate)
                    
                    return (
                      <div
                        key={date.toISOString()}
                        className={`calendar-day ${!isCurrentMonth(date) ? 'calendar-day-other-month' : ''} ${isToday(date) ? 'calendar-day-today' : ''} ${isSelected ? 'calendar-day-selected' : ''}`}
                        onClick={() => setSelectedDate(date)}
                      >
                        <div className="calendar-day-number">
                          {format(date, 'd')}
                        </div>
                        {dayTasks.length > 0 && (
                          <div className="calendar-day-tasks">
                            {dayTasks.slice(0, 3).map((task) => (
                              <div
                                key={task.id}
                                className="calendar-day-task"
                                style={{
                                  backgroundColor: task.stage_name.toLowerCase().includes('conclu') || task.stage_name.toLowerCase().includes('done') 
                                    ? 'var(--tag-green)' 
                                    : task.stage_name.toLowerCase().includes('fazendo') || task.stage_name.toLowerCase().includes('progress')
                                    ? 'var(--tag-blue)'
                                    : 'var(--tag-gray)'
                                }}
                                title={task.title}
                              />
                            ))}
                            {dayTasks.length > 3 && (
                              <div className="calendar-day-task-more">
                                +{dayTasks.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Selected Date Tasks */}
            {selectedDate && (
              <div className="calendar-sidebar">
                <div className="calendar-sidebar-header">
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                    {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 8px' }}
                  >
                    ✕
                  </button>
                </div>
                
                {selectedDateTasks.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    Nenhuma tarefa para esta data
                  </div>
                ) : (
                  <div className="calendar-tasks-list">
                    {selectedDateTasks.map((task) => (
                      <Link
                        key={task.id}
                        to={`/board/${task.board_id}`}
                        className="calendar-task-item"
                      >
                        <div className="calendar-task-header">
                          <span className="calendar-task-title">{task.title}</span>
                          <span className="calendar-task-time">
                            <Clock size={12} />
                            {format(new Date(task.due_date!), 'HH:mm')}
                          </span>
                        </div>
                        <div className="calendar-task-meta">
                          <div className="calendar-task-workspace">
                            <FolderOpen size={12} />
                            <span>{task.workspace_name}</span>
                          </div>
                          <div className="calendar-task-board">
                            <LayoutGrid size={12} />
                            <span>{task.board_name}</span>
                          </div>
                        </div>
                        <div 
                          className="calendar-task-stage"
                          style={{
                            backgroundColor: task.stage_name.toLowerCase().includes('conclu') || task.stage_name.toLowerCase().includes('done') 
                              ? 'var(--tag-green)' 
                              : task.stage_name.toLowerCase().includes('fazendo') || task.stage_name.toLowerCase().includes('progress')
                              ? 'var(--tag-blue)'
                              : 'var(--tag-gray)',
                            color: task.stage_name.toLowerCase().includes('conclu') || task.stage_name.toLowerCase().includes('done') 
                              ? 'var(--tag-green-text)' 
                              : task.stage_name.toLowerCase().includes('fazendo') || task.stage_name.toLowerCase().includes('progress')
                              ? 'var(--tag-blue-text)'
                              : 'var(--tag-gray-text)'
                          }}
                        >
                          {task.stage_name.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

