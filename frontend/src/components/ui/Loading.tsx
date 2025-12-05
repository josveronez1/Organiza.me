interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function Loading({ size = 'md', text }: LoadingProps) {
  const sizeClasses = {
    sm: 'spinner-sm',
    md: '',
    lg: 'spinner-lg',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`spinner ${sizeClasses[size]}`} />
      {text && (
        <p className="text-sm text-[var(--text-tertiary)] animate-pulse">
          {text}
        </p>
      )}
    </div>
  )
}

// Full page loading component
export function PageLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-cyan-400 flex items-center justify-center shadow-xl animate-glow">
            <svg className="w-8 h-8 text-[var(--bg-base)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div className="absolute -inset-2 bg-gradient-to-br from-[var(--accent)] to-cyan-400 rounded-2xl opacity-20 blur-xl -z-10 animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="spinner spinner-lg" />
          <p className="text-sm text-[var(--text-tertiary)]">Carregando...</p>
        </div>
      </div>
    </div>
  )
}
