interface LoadingProps {
  text?: string
}

export function Loading({ text }: LoadingProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div className="spinner" />
      {text && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{text}</p>
      )}
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="loading-page">
      <Loading text="Carregando..." />
    </div>
  )
}
