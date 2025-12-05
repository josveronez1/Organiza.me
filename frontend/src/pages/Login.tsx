import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, ArrowRight, AlertCircle, Loader2, Sparkles } from 'lucide-react'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)
    
    if (error) {
      setError('Email ou senha incorretos')
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-radial flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[var(--accent)] opacity-[0.07] blur-[150px] rounded-full" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-400 opacity-[0.05] blur-[100px] rounded-full animate-float" />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500 opacity-[0.04] blur-[120px] rounded-full animate-float" 
          style={{ animationDelay: '1s' }} 
        />
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)',
            backgroundSize: '64px 64px'
          }}
        />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo & Branding */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-cyan-400 flex items-center justify-center shadow-xl animate-glow">
                <Sparkles className="w-7 h-7 text-[var(--bg-base)]" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-[var(--accent)] to-cyan-400 rounded-2xl opacity-30 blur-lg -z-10" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                OrganizaMe
              </h1>
              <p className="text-sm text-[var(--text-tertiary)]">
                Gestao visual de projetos
              </p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-strong rounded-2xl p-8 shadow-xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
              Bem-vindo de volta
            </h2>
            <p className="text-[var(--text-tertiary)] mt-1 text-sm">
              Entre com suas credenciais para continuar
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-[var(--danger-muted)] border border-[var(--danger)]/20 animate-fade-in-scale">
              <AlertCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--danger)]">Erro ao entrar</p>
                <p className="text-sm text-[var(--danger)]/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Email</label>
              <div className="input-with-icon">
                <Mail className="input-icon w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Senha</label>
                <button 
                  type="button"
                  className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors font-medium"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="input-with-icon">
                <Lock className="input-icon w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="********"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full h-12 mt-2 text-base">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-subtle)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 text-[var(--text-quaternary)] bg-[var(--bg-surface)]">ou continue com</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="btn btn-secondary h-11 gap-3" disabled>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button type="button" className="btn btn-secondary h-11 gap-3" disabled>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>
        </div>

        <p className="text-center text-[var(--text-tertiary)] mt-8 text-sm animate-fade-in" style={{ animationDelay: '200ms' }}>
          Nao tem uma conta?{' '}
          <Link to="/register" className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors">
            Criar conta gratuita
          </Link>
        </p>
      </div>
    </div>
  )
}
