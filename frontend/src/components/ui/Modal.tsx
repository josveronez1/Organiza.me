import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        style={{ animationDuration: '150ms' }}
      />
      
      {/* Modal */}
      <div 
        className={`
          relative w-full ${sizeClasses[size]} 
          bg-[var(--bg-surface)] 
          border border-[var(--border-default)] 
          rounded-2xl 
          shadow-xl
          animate-fade-in-scale
        `}
        onClick={(e) => e.stopPropagation()}
        style={{ animationDuration: '200ms' }}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-icon -mr-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Close button when no title */}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 btn btn-ghost btn-icon z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}
