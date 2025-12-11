import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PinnedBoardsProvider } from './contexts/PinnedBoardsContext'
import { PageLoading } from './components/ui/Loading'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Workspaces } from './pages/Workspaces'
import { WorkspaceDetail } from './pages/WorkspaceDetail'
import { BoardKanban } from './pages/BoardKanban'
import { Calendar } from './pages/Calendar'
import { ReactNode } from 'react'

// Protected Route Component
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <PageLoading />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Public Route Component (redirect if already logged in)
function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <PageLoading />
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />

      {/* Protected Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/workspaces" 
        element={
          <ProtectedRoute>
            <Workspaces />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/calendar" 
        element={
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/workspace/:workspaceId" 
        element={
          <ProtectedRoute>
            <WorkspaceDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/board/:boardId" 
        element={
          <ProtectedRoute>
            <BoardKanban />
          </ProtectedRoute>
        } 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PinnedBoardsProvider>
          <AppRoutes />
        </PinnedBoardsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
