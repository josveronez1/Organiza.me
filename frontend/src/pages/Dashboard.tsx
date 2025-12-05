import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
import { workspacesApi } from '../lib/api'
import { Workspace } from '../types'
import { 
  Plus, 
  FolderOpen, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Loader2
} from 'lucide-react'

export function Dashboard() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
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
    try {
      await workspacesApi.delete(id)
      await loadWorkspaces()
    } catch (error) {
      console.error('Erro ao excluir workspace:', error)
    }
    setOpenMenu(null)
    setDeleteConfirm(null)
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

  if (loading) {
    return (
      <Layout>
        <div className="loading-page">
          <Loading />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-actions">
            <div>
              <h1 className="page-title">Workspaces</h1>
              <p className="page-description">Organize seus projetos em diferentes areas de trabalho</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <Plus size={16} />
              Novo
            </button>
          </div>
        </div>

        {/* Content */}
        {workspaces.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={32} />}
            title="Nenhum workspace"
            description="Crie seu primeiro workspace para comecar a organizar seus projetos."
            action={
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                <Plus size={16} />
                Criar Workspace
              </button>
            }
          />
        ) : (
          <div className="grid">
            {workspaces.map((workspace) => (
              <div key={workspace.id} className="grid-card" style={{ position: 'relative' }}>
                <Link to={`/workspace/${workspace.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div className="grid-card-icon">
                    <FolderOpen size={18} />
                  </div>
                  <h3 className="grid-card-title">{workspace.name}</h3>
                  {workspace.description && (
                    <p className="grid-card-description truncate-2">{workspace.description}</p>
                  )}
                </Link>
                
                {/* Menu */}
                <div className="card-menu" ref={openMenu === workspace.id ? menuRef : null}>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setOpenMenu(openMenu === workspace.id ? null : workspace.id)
                    }}
                    className="btn btn-ghost btn-icon-sm"
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {openMenu === workspace.id && (
                    <div className="dropdown fade-in" style={{ right: 0, top: '100%', marginTop: 4 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(workspace)
                        }}
                        className="dropdown-item"
                      >
                        <Pencil className="dropdown-item-icon" />
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenu(null)
                          setDeleteConfirm(workspace.id)
                        }}
                        className="dropdown-item dropdown-item-danger"
                      >
                        <Trash2 className="dropdown-item-icon" />
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Add Card - Same size as others */}
            <button onClick={() => setIsModalOpen(true)} className="grid-card grid-card-add">
              <Plus className="grid-card-add-icon" />
              <span className="grid-card-add-text">Novo Workspace</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingWorkspace ? 'Editar Workspace' : 'Novo Workspace'}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="input-label">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Ex: Trabalho, Pessoal..."
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="input-label">
              Descricao <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(opcional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
              placeholder="Uma breve descricao..."
            />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={closeModal} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? <Loader2 size={16} className="spinner" /> : (editingWorkspace ? 'Salvar' : 'Criar')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Excluir workspace"
        message="Tem certeza que deseja excluir este workspace? Todos os boards e tarefas serao perdidos."
        confirmText="Excluir"
        variant="danger"
      />
    </Layout>
  )
}
