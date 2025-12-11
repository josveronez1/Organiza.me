import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
import { workspacesApi, boardsApi } from '../lib/api'
import { usePinnedBoards } from '../contexts/PinnedBoardsContext'
import { Workspace, Board } from '../types'
import { 
  Plus, 
  LayoutGrid, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Loader2,
  ArrowLeft,
  Pin,
  PinOff
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
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const { refreshPinnedBoards, pinnedBoards } = usePinnedBoards()
  const menuRef = useRef<HTMLDivElement>(null)
  
  const pinnedBoardIds = pinnedBoards.map(b => b.id)

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
    try {
      await boardsApi.delete(id)
      // Remover dos fixados se estiver fixado
      const saved = localStorage.getItem('pinnedBoards')
      if (saved) {
        const currentPinned: number[] = JSON.parse(saved)
        const newPinned = currentPinned.filter(boardId => boardId !== id)
        localStorage.setItem('pinnedBoards', JSON.stringify(newPinned))
        await refreshPinnedBoards()
      }
      await loadData()
    } catch (error) {
      console.error('Erro ao excluir board:', error)
    }
    setOpenMenu(null)
    setDeleteConfirm(null)
  }

  const handleTogglePin = async (boardId: number) => {
    const saved = localStorage.getItem('pinnedBoards')
    const currentPinned: number[] = saved ? JSON.parse(saved) : []
    const isPinned = currentPinned.includes(boardId)
    const newPinned = isPinned 
      ? currentPinned.filter(id => id !== boardId)
      : [...currentPinned, boardId]
    localStorage.setItem('pinnedBoards', JSON.stringify(newPinned))
    // Atualizar contexto
    await refreshPinnedBoards()
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

  if (loading) {
    return (
      <Layout>
        <div className="loading-page">
          <Loading />
        </div>
      </Layout>
    )
  }

  if (!workspace) {
    return (
      <Layout>
        <div className="page-container">
          <EmptyState
            icon={<LayoutGrid size={32} />}
            title="Workspace nao encontrado"
            description="O workspace que voce esta procurando nao existe."
            action={
              <Link to="/" className="btn btn-primary">
                Voltar
              </Link>
            }
          />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <Link to="/" className="page-back">
            <ArrowLeft className="page-back-icon" />
            Voltar
          </Link>
          
          <div className="page-header-actions">
            <div>
              <h1 className="page-title">{workspace.name}</h1>
              {workspace.description && (
                <p className="page-description">{workspace.description}</p>
              )}
            </div>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <Plus size={16} />
              Novo Board
            </button>
          </div>
        </div>

        {/* Content */}
        {boards.length === 0 ? (
          <EmptyState
            icon={<LayoutGrid size={32} />}
            title="Nenhum board"
            description="Crie seu primeiro board para organizar suas tarefas."
            action={
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                <Plus size={16} />
                Criar Board
              </button>
            }
          />
        ) : (
          <div className="grid">
            {boards.map((board) => (
              <div key={board.id} className="grid-card" style={{ position: 'relative' }}>
                <Link to={`/board/${board.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div className="grid-card-icon">
                    <LayoutGrid size={18} />
                  </div>
                  <h3 className="grid-card-title">{board.name}</h3>
                  <p className="grid-card-description">Clique para abrir o quadro</p>
                </Link>
                
                {/* Menu */}
                <div className="card-menu" ref={openMenu === board.id ? menuRef : null}>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setOpenMenu(openMenu === board.id ? null : board.id)
                    }}
                    className="btn btn-ghost btn-icon-sm"
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {openMenu === board.id && (
                    <div className="dropdown fade-in" style={{ right: 0, top: '100%', marginTop: 4, zIndex: 100 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(board)
                        }}
                        className="dropdown-item"
                      >
                        <Pencil className="dropdown-item-icon" />
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTogglePin(board.id)
                        }}
                        className="dropdown-item"
                      >
                        {pinnedBoardIds.includes(board.id) ? (
                          <>
                            <PinOff className="dropdown-item-icon" />
                            Desfixar
                          </>
                        ) : (
                          <>
                            <Pin className="dropdown-item-icon" />
                            Fixar na sidebar
                          </>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenu(null)
                          setDeleteConfirm(board.id)
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
              <span className="grid-card-add-text">Novo Board</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBoard ? 'Editar Board' : 'Novo Board'}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <label className="input-label">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Ex: Sprint 1, Marketing..."
              required
              autoFocus
            />
            <p className="input-hint">
              3 colunas serao criadas automaticamente: A Fazer, Fazendo e Concluido.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={closeModal} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? <Loader2 size={16} className="spinner" /> : (editingBoard ? 'Salvar' : 'Criar')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Excluir board"
        message="Tem certeza que deseja excluir este board? Todas as colunas e tarefas serao perdidas."
        confirmText="Excluir"
        variant="danger"
      />
    </Layout>
  )
}
