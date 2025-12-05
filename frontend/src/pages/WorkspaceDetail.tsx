import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Modal } from '../components/ui/Modal'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
import { workspacesApi, boardsApi } from '../lib/api'
import { Workspace, Board } from '../types'
import { 
  Plus, 
  Columns3, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Loader2,
  ArrowLeft,
  Layers,
  ArrowUpRight,
  Sparkles
} from 'lucide-react'

export function WorkspaceDetail() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBoard, setEditingBoard] = useState<Board | null>(null)
  const [formData, setFormData] = useState({ name: '' })
  const [saving, setSaving] = useState(false)
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [workspaceId])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null)
      }
    }
    
    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenu])

  const loadData = async () => {
    if (!workspaceId) return
    
    try {
      const [workspaceRes, boardsRes] = await Promise.all([
        workspacesApi.get(Number(workspaceId)),
        boardsApi.list(Number(workspaceId))
      ])
      setWorkspace(workspaceRes.data)
      setBoards(boardsRes.data)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId) return
    
    setSaving(true)

    try {
      if (editingBoard) {
        await boardsApi.update(editingBoard.id, formData)
      } else {
        await boardsApi.create({ 
          name: formData.name, 
          workspace_id: Number(workspaceId),
          position: boards.length
        })
      }
      await loadData()
      closeModal()
    } catch (error) {
      console.error('Erro ao salvar board:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este board? Todas as colunas e tasks serao excluidas.')) {
      return
    }

    try {
      await boardsApi.delete(id)
      await loadData()
    } catch (error) {
      console.error('Erro ao excluir board:', error)
    }
    setOpenMenu(null)
  }

  const openEditModal = (board: Board) => {
    setEditingBoard(board)
    setFormData({ name: board.name })
    setIsModalOpen(true)
    setOpenMenu(null)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingBoard(null)
    setFormData({ name: '' })
  }

  // Premium gradient combinations
  const gradients = [
    'from-violet-500 via-purple-400 to-fuchsia-400',
    'from-sky-500 via-blue-400 to-indigo-400',
    'from-lime-500 via-emerald-400 to-teal-400',
    'from-rose-500 via-pink-400 to-fuchsia-400',
    'from-amber-500 via-yellow-400 to-orange-400',
    'from-teal-500 via-cyan-400 to-sky-400',
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loading size="lg" text="Carregando boards..." />
        </div>
      </Layout>
    )
  }

  if (!workspace) {
    return (
      <Layout>
        <div className="p-8">
          <EmptyState
            icon={<Layers className="w-7 h-7" />}
            title="Workspace nao encontrado"
            description="O workspace que voce esta procurando nao existe ou foi excluido."
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
      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-4 transition-colors text-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Voltar aos Workspaces
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-cyan-400 flex items-center justify-center shadow-lg">
                <Layers className="w-7 h-7 text-[var(--bg-base)]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                  {workspace.name}
                </h1>
                {workspace.description && (
                  <p className="text-[var(--text-tertiary)] mt-1">
                    {workspace.description}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
            >
              <Plus className="w-5 h-5" />
              <span>Novo Board</span>
            </button>
          </div>
        </div>

        {/* Boards Grid */}
        {boards.length === 0 ? (
          <EmptyState
            icon={<Columns3 className="w-7 h-7" />}
            title="Nenhum board ainda"
            description="Crie seu primeiro board para comecar a organizar suas tarefas em colunas Kanban."
            action={
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                <Plus className="w-5 h-5" />
                Criar Board
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {boards.map((board, index) => (
              <div key={board.id} className="group relative">
                <div className="card card-interactive card-accent overflow-hidden">
                  {/* Gradient Header */}
                  <div className={`h-24 bg-gradient-to-br ${gradients[index % gradients.length]} relative overflow-hidden`}>
                    {/* Pattern overlay */}
                    <div 
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '16px 16px'
                      }}
                    />
                    
                    {/* Icon */}
                    <div className="absolute bottom-3 left-4">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                        <Columns3 className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    
                    {/* Menu Button */}
                    <div 
                      className="absolute top-3 right-3" 
                      ref={openMenu === board.id ? menuRef : undefined}
                    >
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setOpenMenu(openMenu === board.id ? null : board.id)
                        }}
                        className="p-2 rounded-lg bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="w-4 h-4 text-white" />
                      </button>

                      {openMenu === board.id && (
                        <div className="absolute right-0 top-full mt-2 dropdown-menu z-50 animate-fade-in-scale">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditModal(board)
                            }}
                            className="dropdown-item"
                          >
                            <Pencil className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(board.id)
                            }}
                            className="dropdown-item dropdown-item-danger"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <Link to={`/board/${board.id}`} className="block p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--text-primary)] text-base truncate group-hover:text-[var(--accent)] transition-colors">
                          {board.name}
                        </h3>
                        <p className="text-sm text-[var(--text-quaternary)] mt-1">
                          Clique para abrir o Kanban
                        </p>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-[var(--text-quaternary)] group-hover:text-[var(--accent)] transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0" />
                    </div>
                  </Link>
                </div>
              </div>
            ))}

            {/* Add New Card */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="card group flex flex-col items-center justify-center min-h-[172px] border-2 border-dashed border-[var(--border-default)] hover:border-[var(--accent)] bg-transparent transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] group-hover:bg-[var(--accent-muted)] flex items-center justify-center transition-all duration-300 mb-3 group-hover:scale-110">
                <Plus className="w-6 h-6 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors" />
              </div>
              <span className="text-[var(--text-tertiary)] group-hover:text-[var(--accent)] font-medium transition-colors">
                Novo Board
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBoard ? 'Editar Board' : 'Novo Board'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Nome do Board
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Ex: Projeto Alpha, Sprint 1..."
              required
              autoFocus
            />
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-muted)] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <p className="text-sm text-[var(--text-tertiary)]">
                Ao criar um board, 3 colunas serao adicionadas automaticamente: <span className="text-[var(--text-secondary)]">"A Fazer"</span>, <span className="text-[var(--text-secondary)]">"Fazendo"</span> e <span className="text-[var(--text-secondary)]">"Concluido"</span>.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                editingBoard ? 'Salvar' : 'Criar Board'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
