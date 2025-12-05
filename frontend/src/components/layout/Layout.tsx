import { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  LayoutGrid, 
  LogOut, 
  User,
  ChevronRight,
  Sparkles,
  Bell,
  Search
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  // Extract breadcrumb from current path
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const breadcrumbLabels: Record<string, string> = {
    workspace: 'Workspace',
    board: 'Board'
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong border-b border-[var(--border-subtle)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left Section: Logo & Breadcrumb */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-cyan-400 flex items-center justify-center shadow-lg group-hover:shadow-[var(--shadow-glow)] transition-shadow duration-300">
                  <Sparkles className="w-5 h-5 text-[var(--bg-base)]" />
                </div>
              </div>
              <span className="text-lg font-semibold text-[var(--text-primary)] hidden sm:block tracking-tight">
                OrganizaMe
              </span>
            </Link>

            {/* Breadcrumb */}
            {pathSegments.length > 0 && (
              <nav className="hidden md:flex items-center text-sm">
                <ChevronRight className="w-4 h-4 text-[var(--text-quaternary)]" />
                {pathSegments.map((segment, index) => {
                  const isLast = index === pathSegments.length - 1
                  const label = breadcrumbLabels[segment] || segment
                  const isNumber = !isNaN(Number(segment))
                  
                  return (
                    <div key={index} className="flex items-center">
                      {index > 0 && (
                        <ChevronRight className="w-4 h-4 mx-1 text-[var(--text-quaternary)]" />
                      )}
                      <span 
                        className={`px-2 py-1 rounded-md ${
                          isLast 
                            ? 'text-[var(--text-primary)] bg-[var(--bg-elevated)]' 
                            : 'text-[var(--text-tertiary)]'
                        }`}
                      >
                        {isNumber ? `#${segment}` : label.charAt(0).toUpperCase() + label.slice(1)}
                      </span>
                    </div>
                  )
                })}
              </nav>
            )}
          </div>

          {/* Right Section: Actions & User */}
          <div className="flex items-center gap-2">
            {/* Search (visual placeholder) */}
            <button className="btn btn-ghost btn-icon hidden sm:flex">
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications (visual placeholder) */}
            <button className="btn btn-ghost btn-icon relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--accent)] rounded-full" />
            </button>

            {/* Dashboard Link */}
            <Link 
              to="/" 
              className="btn btn-ghost btn-icon"
              title="Dashboard"
            >
              <LayoutGrid className="w-5 h-5" />
            </Link>

            {/* Divider */}
            <div className="w-px h-8 bg-[var(--border-subtle)] mx-2 hidden sm:block" />

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-[var(--text-primary)] max-w-[140px] truncate">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                </span>
                <span className="text-xs text-[var(--text-quaternary)]">
                  Free Plan
                </span>
              </div>
              <div className="avatar avatar-md">
                <User className="w-4 h-4" />
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleSignOut}
              className="btn btn-ghost btn-icon text-[var(--text-tertiary)] hover:text-[var(--danger)]"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-subtle pointer-events-none" />
        <div className="relative">
          {children}
        </div>
      </main>
    </div>
  )
}
