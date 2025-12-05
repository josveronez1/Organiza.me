import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
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

  const sizeClass = size === 'lg' ? 'modal-lg' : ''

  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div className={`modal ${sizeClass}`} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            <button onClick={onClose} className="btn btn-ghost btn-icon-sm modal-close">
              <X size={18} />
            </button>
          </div>
        )}

        {!title && (
          <button 
            onClick={onClose} 
            className="btn btn-ghost btn-icon-sm"
            style={{ position: 'absolute', top: 12, right: 12 }}
          >
            <X size={18} />
          </button>
        )}

        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}
