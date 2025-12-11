import { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usePinnedBoards } from '../../contexts/PinnedBoardsContext'
import { 
  LogOut, 
  Home,
  FolderOpen,
  LayoutGrid,
  Calendar
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { pinnedBoards } = usePinnedBoards()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <div className="sidebar-logo-icon">O</div>
            <span>OrganizaMe</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Menu</div>
            <Link 
              to="/" 
              className={`sidebar-item ${isActive('/') ? 'active' : ''}`}
            >
              <Home className="sidebar-item-icon" />
              <span>Inicio</span>
            </Link>
            <Link 
              to="/workspaces" 
              className={`sidebar-item ${location.pathname === '/workspaces' || location.pathname.startsWith('/workspace/') ? 'active' : ''}`}
            >
              <FolderOpen className="sidebar-item-icon" />
              <span>Workspaces</span>
            </Link>
            <Link 
              to="/calendar" 
              className={`sidebar-item ${isActive('/calendar') ? 'active' : ''}`}
            >
              <Calendar className="sidebar-item-icon" />
              <span>Calendário</span>
            </Link>
          </div>

          {/* Pinned Boards */}
          {pinnedBoards.length > 0 && (
            <div className="sidebar-section">
              <div className="sidebar-section-title">Fixados</div>
              {pinnedBoards.map((board) => (
                <Link
                  key={board.id}
                  to={`/board/${board.id}`}
                  className={`sidebar-item ${location.pathname === `/board/${board.id}` ? 'active' : ''}`}
                >
                  <LayoutGrid className="sidebar-item-icon" />
                  <span className="truncate">{board.name}</span>
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'}
              </div>
              <div className="sidebar-user-email truncate">
                {user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="sidebar-item"
            style={{ marginTop: '8px' }}
          >
            <LogOut className="sidebar-item-icon" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
