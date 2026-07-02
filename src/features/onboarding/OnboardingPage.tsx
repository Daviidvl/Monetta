import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, TrendingUp } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Input'
import { saveProfile } from '../../database/queries'
import { useAppStore } from '../../store/useAppStore'
import { parseNumber, formatCurrency } from '../../utils/format'
import { toMonthlyIncome } from '../../utils/income'
import { INCOME_FREQUENCY_LABELS, type IncomeFrequency } from '../../types'

const STEP_COUNT = 4

const goalOptions = [
  { value: 'emergency', label: 'Criar reserva de emergência' },
  { value: 'debt', label: 'Sair das dívidas' },
  { value: 'invest', label: 'Começar a investir' },
  { value: 'buy', label: 'Guardar para uma compra grande' },
  { value: 'control', label: 'Organizar meu orçamento' },
]

const dayOptions = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: `Dia ${i + 1}`,
}))

const frequencyOptions: { value: IncomeFrequency; label: string }[] =
  (['daily', 'weekly', 'biweekly', 'monthly'] as const).map(value => ({
    value,
    label: INCOME_FREQUENCY_LABELS[value],
  }))

const incomeQuestion: Record<IncomeFrequency, string> = {
  daily:    'Quanto você recebe por dia?',
  weekly:   'Quanto você recebe por semana?',
  biweekly: 'Quanto você recebe por quinzena?',
  monthly:  'Quanto você recebe por mês?',
}

const paydayCopy: Record<IncomeFrequency, { title: string; subtitle: string; label: string }> = {
  monthly: {
    title: 'Quando você recebe?',
    subtitle: 'Isso nos ajuda a organizar seu calendário financeiro.',
    label: 'Dia do pagamento',
  },
  biweekly: {
    title: 'Qual o primeiro dia de pagamento no mês?',
    subtitle: 'Você recebe quinzenalmente — vamos usar essa primeira data para o calendário.',
    label: 'Dia do 1º pagamento',
  },
  weekly: {
    title: 'Uma data de referência para o calendário?',
    subtitle: 'Como você recebe toda semana, escolha um dia do mês pra gente se orientar.',
    label: 'Dia de referência',
  },
  daily: {
    title: 'Uma data de referência para o calendário?',
    subtitle: 'Como você recebe todo dia, isso é só uma data de referência.',
    label: 'Dia de referência',
  },
}

interface StepProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

function Step({ children, title, subtitle }: StepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-6"
    >
      <div>
        <h2 className="text-2xl font-semibold text-text-primary tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-text-muted">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  )
}

export function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const { setHasOnboarded } = useAppStore()

  const [name, setName] = useState('')
  const [income, setIncome] = useState('')
  const [frequency, setFrequency] = useState<IncomeFrequency>('monthly')
  const [paymentDay, setPaymentDay] = useState('5')
  const [goal, setGoal] = useState('control')

  const canProceed = [
    name.trim().length > 0,
    parseNumber(income) > 0,
    true,
    true,
  ][step]

  async function handleFinish() {
    setLoading(true)
    try {
      await saveProfile({
        name: name.trim(),
        monthlyIncome: toMonthlyIncome(parseNumber(income), frequency),
        incomeFrequency: frequency,
        incomeAmount: parseNumber(income),
        paymentDay: parseInt(paymentDay),
        financialGoal: goal,
        theme: 'light',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setHasOnboarded(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-surface-0 px-6 py-12 max-w-md mx-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-8 h-8 rounded-xl bg-accent-500 flex items-center justify-center">
          <TrendingUp size={16} className="text-white" />
        </div>
        <span className="text-base font-semibold text-text-primary">Monetta</span>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 mb-10">
        {Array.from({ length: STEP_COUNT }).map((_, i) => (
          <motion.div
            key={i}
            className="h-1 rounded-full flex-1"
            animate={{ backgroundColor: i <= step ? '#635BFF' : 'var(--surface-200)' }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Steps */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <Step key="name" title="Olá! Como posso te chamar?" subtitle="Vamos personalizar sua experiência.">
              <Input
                label="Seu nome"
                placeholder="Ex: David"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && canProceed && setStep(1)}
              />
            </Step>
          )}
          {step === 1 && (
            <Step key="income" title={`Oi, ${name}!`} subtitle="Como você recebe sua renda?">
              <div className="grid grid-cols-4 gap-2">
                {frequencyOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFrequency(opt.value)}
                    className={`px-2 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                      frequency === opt.value
                        ? 'border-accent-500 bg-accent-500/8 text-accent-500'
                        : 'border-border-base text-text-secondary hover:border-border-strong'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <Input
                label={incomeQuestion[frequency]}
                placeholder="Ex: 3500"
                type="number"
                value={income}
                onChange={e => setIncome(e.target.value)}
                prefix={<span className="text-xs font-medium">R$</span>}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && canProceed && setStep(2)}
                hint={
                  frequency !== 'monthly' && parseNumber(income) > 0
                    ? `≈ ${formatCurrency(toMonthlyIncome(parseNumber(income), frequency))}/mês`
                    : undefined
                }
              />
            </Step>
          )}
          {step === 2 && (
            <Step key="payday" title={paydayCopy[frequency].title} subtitle={paydayCopy[frequency].subtitle}>
              <Select
                label={paydayCopy[frequency].label}
                value={paymentDay}
                onChange={e => setPaymentDay(e.target.value)}
                options={dayOptions}
              />
            </Step>
          )}
          {step === 3 && (
            <Step key="goal" title="Qual é seu principal objetivo?" subtitle="Foque em um objetivo por vez — é mais eficaz.">
              <div className="flex flex-col gap-2">
                {goalOptions.map(opt => (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setGoal(opt.value)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-sm font-medium transition-colors text-left ${
                      goal === opt.value
                        ? 'border-accent-500 bg-accent-500/8 text-accent-500'
                        : 'border-border-base text-text-primary hover:border-border-strong hover:bg-surface-50'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      goal === opt.value ? 'border-accent-500' : 'border-surface-300'
                    }`}>
                      {goal === opt.value && <span className="w-2 h-2 rounded-full bg-accent-500" />}
                    </span>
                    {opt.label}
                  </motion.button>
                ))}
              </div>
            </Step>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button variant="secondary" size="lg" onClick={() => setStep(s => s - 1)}>
            Voltar
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canProceed}
          loading={step === STEP_COUNT - 1 && loading}
          onClick={() => {
            if (step < STEP_COUNT - 1) setStep(s => s + 1)
            else handleFinish()
          }}
          iconEnd={step < STEP_COUNT - 1 ? <ChevronRight size={16} /> : undefined}
        >
          {step < STEP_COUNT - 1 ? 'Continuar' : 'Começar'}
        </Button>
      </div>
    </div>
  )
}
