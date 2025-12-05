import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Modal } from '../components/ui/Modal'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
import { workspacesApi } from '../lib/api'
import { Workspace } from '../types'
import { 
  Plus, 
  Briefcase, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Loader2,
  Layers,
  ArrowUpRight,
  Sparkles
} from 'lucide-react'

export function Dashboard() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadWorkspaces()
  }, [])

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

  const loadWorkspaces = async () => {
    try {
      const response = await workspacesApi.list()
      setWorkspaces(response.data)
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingWorkspace) {
        await workspacesApi.update(editingWorkspace.id, formData)
      } else {
        await workspacesApi.create(formData)
      }
      await loadWorkspaces()
      closeModal()
    } catch (error) {
      console.error('Erro ao salvar workspace:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este workspace? Todos os boards e tasks serao excluidos.')) {
      return
    }

    try {
      await workspacesApi.delete(id)
      await loadWorkspaces()
    } catch (error) {
      console.error('Erro ao excluir workspace:', error)
    }
    setOpenMenu(null)
  }

  const openEditModal = (workspace: Workspace) => {
    setEditingWorkspace(workspace)
    setFormData({ name: workspace.name, description: workspace.description || '' })
    setIsModalOpen(true)
    setOpenMenu(null)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingWorkspace(null)
    setFormData({ name: '', description: '' })
  }

  // Premium gradient combinations
  const gradients = [
    'from-cyan-500 via-cyan-400 to-teal-400',
    'from-violet-500 via-purple-400 to-fuchsia-400',
    'from-amber-500 via-orange-400 to-rose-400',
    'from-emerald-500 via-green-400 to-cyan-400',
    'from-blue-500 via-indigo-400 to-violet-400',
    'from-rose-500 via-pink-400 to-fuchsia-400',
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loading size="lg" text="Carregando workspaces..." />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
              Workspaces
            </h1>
            <p className="text-[var(--text-tertiary)] mt-2 text-base">
              Organize seus projetos em diferentes areas de trabalho
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary animate-fade-in"
            style={{ animationDelay: '100ms' }}
          >
            <Plus className="w-5 h-5" />
            <span>Novo Workspace</span>
          </button>
        </div>

        {/* Workspaces Grid */}
        {workspaces.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-7 h-7" />}
            title="Nenhum workspace ainda"
            description="Crie seu primeiro workspace para comecar a organizar seus projetos e tarefas."
            action={
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                <Plus className="w-5 h-5" />
                Criar Workspace
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {workspaces.map((workspace, index) => (
              <div
                key={workspace.id}
                className="group relative"
              >
                <div className="card card-interactive card-accent overflow-hidden">
                  {/* Gradient Header */}
                  <div className={`h-28 bg-gradient-to-br ${gradients[index % gradients.length]} relative overflow-hidden`}>
                    {/* Pattern overlay */}
                    <div 
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '16px 16px'
                      }}
                    />
                    
                    {/* Icon */}
                    <div className="absolute bottom-4 left-5">
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                        <Layers className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    
                    {/* Menu Button */}
                    <div 
                      className="absolute top-3 right-3" 
                      ref={openMenu === workspace.id ? menuRef : undefined}
                    >
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setOpenMenu(openMenu === workspace.id ? null : workspace.id)
                        }}
                        className="p-2 rounded-lg bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="w-4 h-4 text-white" />
                      </button>

                      {openMenu === workspace.id && (
                        <div className="absolute right-0 top-full mt-2 dropdown-menu z-50 animate-fade-in-scale">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditModal(workspace)
                            }}
                            className="dropdown-item"
                          >
                            <Pencil className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(workspace.id)
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
                  <Link to={`/workspace/${workspace.id}`} className="block p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--text-primary)] text-base truncate group-hover:text-[var(--accent)] transition-colors">
                          {workspace.name}
                        </h3>
                        {workspace.description && (
                          <p className="text-sm text-[var(--text-tertiary)] mt-1.5 truncate-2">
                            {workspace.description}
                          </p>
                        )}
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
              className="card group flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-[var(--border-default)] hover:border-[var(--accent)] bg-transparent transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface)] group-hover:bg-[var(--accent-muted)] flex items-center justify-center transition-all duration-300 mb-4 group-hover:scale-110">
                <Plus className="w-7 h-7 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors" />
              </div>
              <span className="text-[var(--text-tertiary)] group-hover:text-[var(--accent)] font-medium transition-colors">
                Novo Workspace
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingWorkspace ? 'Editar Workspace' : 'Novo Workspace'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Nome
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Ex: Trabalho, Pessoal, Estudos..."
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Descricao
              <span className="text-[var(--text-quaternary)] font-normal ml-1">(opcional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input resize-none"
              rows={3}
              placeholder="Uma breve descricao do workspace..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                editingWorkspace ? 'Salvar' : 'Criar'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
