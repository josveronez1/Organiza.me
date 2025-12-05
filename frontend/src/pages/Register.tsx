import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, User, AlertCircle, Loader2, CheckCircle } from 'lucide-react'

export function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()

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
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: 6,
            background: 'var(--success-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <CheckCircle size={24} color="var(--success)" />
          </div>
          <h2 className="auth-title">Conta criada!</h2>
          <p className="auth-subtitle">Verifique seu email para confirmar sua conta.</p>
          <Link to="/login" className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
            Ir para Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">O</div>
          <span className="auth-logo-text">OrganizaMe</span>
        </div>

        <h1 className="auth-title">Criar conta</h1>
        <p className="auth-subtitle">Preencha os dados para comecar</p>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div>
            <label className="input-label">Nome completo</label>
            <div className="input-group">
              <User className="input-group-icon" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
                placeholder="Seu nome"
                required
              />
            </div>
          </div>

          <div>
            <label className="input-label">Email</label>
            <div className="input-group">
              <Mail className="input-group-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="input-label">Senha</label>
            <div className="input-group">
              <Lock className="input-group-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Minimo 6 caracteres"
                required
              />
            </div>
          </div>

          <div>
            <label className="input-label">Confirmar senha</label>
            <div className="input-group">
              <Lock className="input-group-icon" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="Repita a senha"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '10px', marginTop: '8px' }}>
            {loading ? <Loader2 size={18} className="spinner" /> : 'Criar conta'}
          </button>
        </form>

        <p className="auth-link">
          Ja tem uma conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
