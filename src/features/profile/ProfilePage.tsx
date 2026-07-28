import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Trash2, Check } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useProfile } from '../../hooks/useData'
import { saveProfile } from '../../database/queries'
import { useAuthStore } from '../../store/useAuthStore'
import { supabase } from '../../lib/supabaseClient'
import { parseNumber } from '../../utils/format'
import { toMonthlyIncome } from '../../utils/income'
import { INCOME_FREQUENCY_LABELS, type IncomeFrequency, type UserProfile } from '../../types'

const frequencyOptions: { value: IncomeFrequency; label: string }[] =
  (['monthly', 'biweekly', 'weekly', 'daily', 'variable'] as const).map(value => ({
    value, label: INCOME_FREQUENCY_LABELS[value],
  }))

const dayOptions = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: `Dia ${i + 1}` }))

const goalOptions = [
  { value: 'emergency', label: 'Criar reserva de emergência' },
  { value: 'debt', label: 'Sair das dívidas' },
  { value: 'invest', label: 'Começar a investir' },
  { value: 'buy', label: 'Guardar para uma compra grande' },
  { value: 'control', label: 'Organizar meu orçamento' },
]

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60dvh]">
      <div className="w-5 h-5 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
    </div>
  )
}

export function ProfilePage() {
  const profile = useProfile()
  if (!profile) return <PageLoader />
  return <ProfileContent profile={profile} />
}

function ProfileContent({ profile }: { profile: UserProfile }) {
  const user = useAuthStore(s => s.user)

  const [name, setName] = useState(profile.name)
  const [frequency, setFrequency] = useState<IncomeFrequency>(profile.incomeFrequency)
  const [income, setIncome] = useState(String(profile.incomeAmount))
  const [income2, setIncome2] = useState(profile.incomeAmountSecondary != null ? String(profile.incomeAmountSecondary) : '')
  const [workDays, setWorkDays] = useState(profile.workDaysPerMonth != null ? String(profile.workDaysPerMonth) : '22')
  const [paymentDay, setPaymentDay] = useState(String(profile.paymentDay))
  const [goal, setGoal] = useState(profile.financialGoal)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [loggingOut, setLoggingOut] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  function buildIncomeInput() {
    return {
      frequency,
      amount: parseNumber(income),
      amountSecondary: frequency === 'biweekly' && income2.trim() !== '' ? parseNumber(income2) : undefined,
      workDays: frequency === 'daily' ? (parseInt(workDays) || undefined) : undefined,
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveProfile({
        name: name.trim(),
        monthlyIncome: toMonthlyIncome(buildIncomeInput()),
        incomeFrequency: frequency,
        incomeAmount: parseNumber(income),
        incomeAmountSecondary: frequency === 'biweekly' && income2.trim() !== '' ? parseNumber(income2) : undefined,
        workDaysPerMonth: frequency === 'daily' ? (parseInt(workDays) || undefined) : undefined,
        paymentDay: parseInt(paymentDay),
        financialGoal: goal,
        theme: profile.theme,
        createdAt: profile.createdAt,
        updatedAt: new Date(),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão inválida — faça login novamente.')

      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) throw new Error('Não foi possível apagar a conta. Tente novamente.')

      await supabase.auth.signOut()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Algo deu errado.')
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader title="Perfil" subtitle="Seus dados e configurações de conta." />

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader
            action={
              <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
                {saved ? <span className="flex items-center gap-1.5"><Check size={14} /> Salvo</span> : 'Salvar'}
              </Button>
            }
          >
            <CardTitle>Dados pessoais</CardTitle>
          </CardHeader>

          <div className="flex flex-col gap-4">
            <Input label="Nome" value={name} onChange={e => setName(e.target.value)} />

            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">Frequência de renda</label>
              <div className="grid grid-cols-3 gap-2">
                {frequencyOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFrequency(opt.value)}
                    className={`px-2 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                      frequency === opt.value
                        ? 'border-accent-500 bg-gradient-primary text-white'
                        : 'border-border-base text-text-secondary hover:border-border-strong'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {frequency === 'biweekly' ? (
              <div className="grid grid-cols-2 gap-3">
                <Input label="1º pagamento" type="number" value={income} onChange={e => setIncome(e.target.value)} prefix={<span className="text-xs font-medium">R$</span>} />
                <Input label="2º pagamento" type="number" value={income2} onChange={e => setIncome2(e.target.value)} prefix={<span className="text-xs font-medium">R$</span>} />
              </div>
            ) : frequency === 'daily' ? (
              <div className="grid grid-cols-2 gap-3">
                <Input label="Valor por dia" type="number" value={income} onChange={e => setIncome(e.target.value)} prefix={<span className="text-xs font-medium">R$</span>} />
                <Input label="Dias/mês" type="number" value={workDays} onChange={e => setWorkDays(e.target.value)} />
              </div>
            ) : (
              <Input
                label={frequency === 'weekly' ? 'Valor por semana' : frequency === 'variable' ? 'Renda média mensal' : 'Valor por mês'}
                type="number"
                value={income}
                onChange={e => setIncome(e.target.value)}
                prefix={<span className="text-xs font-medium">R$</span>}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <Select label="Dia do pagamento" value={paymentDay} onChange={e => setPaymentDay(e.target.value)} options={dayOptions} />
              <Select label="Objetivo principal" value={goal} onChange={e => setGoal(e.target.value)} options={goalOptions} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Conta</CardTitle></CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-primary font-medium">{user?.email}</p>
              <p className="text-xs text-text-muted mt-0.5">Logado com email e senha</p>
            </div>
            <Button variant="secondary" icon={<LogOut size={15} />} loading={loggingOut} onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </Card>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border border-status-danger/20">
            <CardHeader><CardTitle className="text-status-danger">Zona de risco</CardTitle></CardHeader>
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-text-muted flex-1">
                Apaga sua conta e todos os dados (contas, investimentos, metas, histórico) permanentemente. Não pode ser desfeito.
              </p>
              <Button
                variant="secondary"
                className="text-status-danger border-status-danger/30 hover:bg-status-danger/8 flex-shrink-0"
                icon={<Trash2 size={15} />}
                onClick={() => setConfirmDeleteOpen(true)}
              >
                Apagar conta
              </Button>
            </div>
            {deleteError && <p className="text-xs text-status-danger mt-3">{deleteError}</p>}
          </Card>
        </motion.div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Apagar sua conta?"
        description="Isso remove permanentemente sua conta e todos os dados associados. Não pode ser desfeito."
        confirmLabel="Apagar conta"
        loading={deleting}
      />
    </div>
  )
}
