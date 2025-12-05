import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state animate-fade-in">
      {icon && (
        <div className="empty-state-icon">
          {icon}
        </div>
      )}
      <h3 className="empty-state-title">{title}</h3>
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  )
}
