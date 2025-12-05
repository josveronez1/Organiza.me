import { Modal } from './Modal'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Erro ao confirmar acao:', error)
    } finally {
      setLoading(false)
    }
  }

  const iconColor = variant === 'danger' 
    ? 'var(--red)' 
    : variant === 'warning' 
      ? 'var(--orange)' 
      : 'var(--blue)'

  const buttonClass = variant === 'danger' 
    ? 'btn btn-danger' 
    : variant === 'warning' 
      ? 'btn btn-warning' 
      : 'btn btn-primary'

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        textAlign: 'center',
        padding: '8px 0'
      }}>
        <div style={{ 
          width: 48, 
          height: 48, 
          borderRadius: '50%', 
          backgroundColor: `${iconColor}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16
        }}>
          <AlertTriangle size={24} style={{ color: iconColor }} />
        </div>

        <h3 style={{ 
          fontSize: 16, 
          fontWeight: 600, 
          color: 'var(--text-primary)',
          marginBottom: 8
        }}>
          {title}
        </h3>

        <p style={{ 
          fontSize: 14, 
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginBottom: 24
        }}>
          {message}
        </p>

        <div style={{ 
          display: 'flex', 
          gap: 8, 
          width: '100%',
          justifyContent: 'center'
        }}>
          <button 
            onClick={onClose} 
            className="btn btn-secondary"
            disabled={loading}
            style={{ flex: 1, maxWidth: 120 }}
          >
            {cancelText}
          </button>
          <button 
            onClick={handleConfirm} 
            className={buttonClass}
            disabled={loading}
            style={{ flex: 1, maxWidth: 120 }}
          >
            {loading ? <Loader2 size={16} className="spinner" /> : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
