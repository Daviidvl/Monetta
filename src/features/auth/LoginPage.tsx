import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Mail, Lock } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { supabase } from '../../lib/supabaseClient'

function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Email ou senha incorretos.'
  if (message.includes('User already registered')) return 'Já existe uma conta com esse email.'
  if (message.includes('Password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (message.includes('Unable to validate email address')) return 'Email inválido.'
  return message
}

export function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signupDone, setSignupDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
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
                  label="Senha"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  prefix={<Lock size={16} />}
                  minLength={6}
                  required
                />

                {error && <p className="text-xs text-status-danger">{error}</p>}

                <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} className="mt-2">
                  {mode === 'signin' ? 'Entrar' : 'Criar conta'}
                </Button>
              </form>

              <button
                type="button"
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
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
