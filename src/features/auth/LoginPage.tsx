import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { supabase } from '../../lib/supabaseClient'
import { getPasswordStrength } from '../../utils/passwordStrength'
import { cn } from '../../utils/cn'

function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Email ou senha incorretos.'
  if (message.includes('User already registered')) return 'Já existe uma conta com esse email.'
  if (message.includes('Password should be at least')) return 'A senha precisa ter pelo menos 8 caracteres.'
  if (message.includes('Unable to validate email address')) return 'Email inválido.'
  return message
}

function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null
  const { level, label } = getPasswordStrength(password)
  const barsFilled = level === 'weak' ? 1 : level === 'medium' ? 2 : 3
  const barColor = level === 'weak' ? 'bg-status-danger' : level === 'medium' ? 'bg-status-warning' : 'bg-status-success'
  const textColor = level === 'weak' ? 'text-status-danger' : level === 'medium' ? 'text-status-warning' : 'text-status-success'

  return (
    <div className="flex items-center gap-2 -mt-2">
      <div className="flex-1 flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={cn('h-1 flex-1 rounded-full transition-colors duration-200', i < barsFilled ? barColor : 'bg-surface-200')}
          />
        ))}
      </div>
      <span className={cn('text-xs font-medium', textColor)}>{label}</span>
    </div>
  )
}

export function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signupDone, setSignupDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const passwordsMismatch = mode === 'signup' && confirmPassword.length > 0 && password !== confirmPassword

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.')
        return
      }
      if (getPasswordStrength(password).level === 'weak') {
        setError('Escolha uma senha mais forte: use pelo menos 8 caracteres com letras maiúsculas, minúsculas, números e símbolos.')
        return
      }
    }

    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSignupDone(true)
      }
    } catch (err) {
      setError(translateAuthError(err instanceof Error ? err.message : 'Algo deu errado.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-dvh flex flex-col bg-surface-0 overflow-hidden">
      <motion.div
        className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-gradient-primary opacity-[0.18] blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute top-1/3 -right-28 w-80 h-80 rounded-full bg-accent-400 opacity-[0.14] blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 30, 0], scale: [1.05, 1, 1.05] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <div className="relative z-10 flex flex-col flex-1 items-center justify-center px-6 py-12 max-w-md mx-auto w-full">
        <motion.div
          className="flex items-center gap-2.5 mb-10"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="text-base font-semibold text-text-primary font-heading">Monetta</span>
        </motion.div>

        <motion.div
          className="w-full bg-surface-0 rounded-3xl shadow-card p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {signupDone ? (
            <div className="text-center py-4">
              <h1 className="text-lg font-semibold text-text-primary font-heading mb-2">Confirme seu email</h1>
              <p className="text-sm text-text-muted">
                Enviamos um link de confirmação para <strong>{email}</strong>. Depois de confirmar, é só entrar normalmente.
              </p>
              <Button variant="secondary" fullWidth className="mt-6" onClick={() => { setSignupDone(false); setMode('signin') }}>
                Voltar para o login
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-text-primary font-heading mb-1">
                {mode === 'signin' ? 'Entrar' : 'Criar conta'}
              </h1>
              <p className="text-sm text-text-muted mb-6">
                {mode === 'signin'
                  ? 'Acesse seu painel financeiro de qualquer dispositivo.'
                  : 'Seus dados ficam sincronizados entre celular e computador.'}
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  prefix={<Mail size={16} />}
                  autoFocus
                  required
                />
                <Input
                  label={mode === 'signup' ? 'Crie uma senha' : 'Senha'}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  prefix={<Lock size={16} />}
                  suffix={
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                      className="pointer-events-auto text-text-muted hover:text-text-primary transition-colors"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  minLength={mode === 'signup' ? 8 : 6}
                  required
                />

                {mode === 'signup' && <PasswordStrengthMeter password={password} />}

                {mode === 'signup' && (
                  <Input
                    label="Confirme a senha"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    prefix={<Lock size={16} />}
                    suffix={
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirmPassword(v => !v)}
                        className="pointer-events-auto text-text-muted hover:text-text-primary transition-colors"
                        aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                    error={passwordsMismatch ? 'As senhas não coincidem.' : undefined}
                    minLength={8}
                    required
                  />
                )}

                {error && <p className="text-xs text-status-danger">{error}</p>}

                <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} className="mt-2">
                  {mode === 'signin' ? 'Entrar' : 'Criar conta'}
                </Button>
              </form>

              <button
                type="button"
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setPassword(''); setConfirmPassword('') }}
                className="w-full text-center text-sm text-text-muted mt-5 hover:text-text-primary transition-colors"
              >
                {mode === 'signin' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
              </button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
