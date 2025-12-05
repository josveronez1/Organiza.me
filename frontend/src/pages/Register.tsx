import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, User, ArrowRight, AlertCircle, Loader2, CheckCircle, Sparkles } from 'lucide-react'

export function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('As senhas nao coincidem')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)

    const { error } = await signUp(email, password, fullName)
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-radial flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-10 text-center animate-fade-in-scale shadow-xl">
            <div className="w-20 h-20 rounded-2xl bg-[var(--success-muted)] flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-[var(--success)]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
              Conta criada com sucesso!
            </h2>
            <p className="text-[var(--text-tertiary)] mb-8">
              Verifique seu email para confirmar sua conta.
            </p>
            <Link to="/login" className="btn btn-primary w-full h-12">
              Ir para Login
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-radial flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[var(--accent)] opacity-[0.07] blur-[150px] rounded-full" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-cyan-400 opacity-[0.05] blur-[100px] rounded-full animate-float" />
        <div 
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-teal-500 opacity-[0.04] blur-[120px] rounded-full animate-float" 
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
                Crie sua conta gratuita
              </p>
            </div>
          </div>
        </div>

        {/* Register Card */}
        <div className="glass-strong rounded-2xl p-8 shadow-xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
              Criar Conta
            </h2>
            <p className="text-[var(--text-tertiary)] mt-1 text-sm">
              Preencha os dados para comecar
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-[var(--danger-muted)] border border-[var(--danger)]/20 animate-fade-in-scale">
              <AlertCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--danger)]">Erro ao criar conta</p>
                <p className="text-sm text-[var(--danger)]/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Nome completo</label>
              <div className="input-with-icon">
                <User className="input-icon w-5 h-5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input"
                  placeholder="Seu nome"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

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
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Senha</label>
              <div className="input-with-icon">
                <Lock className="input-icon w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="********"
                  required
                  autoComplete="new-password"
                />
              </div>
              <p className="text-xs text-[var(--text-quaternary)]">Minimo 6 caracteres</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Confirmar Senha</label>
              <div className="input-with-icon">
                <Lock className="input-icon w-5 h-5" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  placeholder="********"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full h-12 mt-2 text-base">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Criar Conta
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[var(--text-tertiary)] text-sm mt-6">
            Ao criar uma conta, voce concorda com nossos{' '}
            <button className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium">
              Termos de Servico
            </button>
          </p>
        </div>

        <p className="text-center text-[var(--text-tertiary)] mt-8 text-sm animate-fade-in" style={{ animationDelay: '200ms' }}>
          Ja tem uma conta?{' '}
          <Link to="/login" className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
