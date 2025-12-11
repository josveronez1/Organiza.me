import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { boardsApi } from '../lib/api'
import { Board } from '../types'

interface PinnedBoardsContextType {
  pinnedBoards: Board[]
  refreshPinnedBoards: () => Promise<void>
}

const PinnedBoardsContext = createContext<PinnedBoardsContextType | undefined>(undefined)

export function PinnedBoardsProvider({ children }: { children: ReactNode }) {
  const [pinnedBoards, setPinnedBoards] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshPinnedBoards = async () => {
    const saved = localStorage.getItem('pinnedBoards')
    if (saved) {
      try {
        const boardIds: number[] = JSON.parse(saved)
        const boards = await Promise.all(
          boardIds.map(id => boardsApi.get(id).then(res => res.data).catch(() => null))
        )
        // Filtrar boards que não existem mais
        const validBoards = boards.filter((board): board is Board => board !== null)
        setPinnedBoards(validBoards)
        
        // Atualizar localStorage se algum board foi removido
        const validIds = validBoards.map(b => b.id)
        if (validIds.length !== boardIds.length) {
          localStorage.setItem('pinnedBoards', JSON.stringify(validIds))
        }
      } catch (error) {
        console.error('Erro ao carregar boards fixados:', error)
        setPinnedBoards([])
      }
    } else {
      setPinnedBoards([])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    refreshPinnedBoards()

    // Escutar mudanças no localStorage
    const handleStorageChange = () => {
      refreshPinnedBoards()
    }
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('pinnedBoardsChanged', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('pinnedBoardsChanged', handleStorageChange)
    }
  }, [])

  return (
    <PinnedBoardsContext.Provider value={{ pinnedBoards, refreshPinnedBoards }}>
      {children}
    </PinnedBoardsContext.Provider>
  )
}

export function usePinnedBoards() {
  const context = useContext(PinnedBoardsContext)
  if (context === undefined) {
    throw new Error('usePinnedBoards must be used within a PinnedBoardsProvider')
  }
  return context
}


